import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { GetCommand, PutCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { docClient, s3Client, TABLES, S3_BUCKET } from '../../shared/db/index.js';
import { getAuthenticatedUser } from '../../shared/auth/index.js';
import { successResponse, errorResponse, parseJsonBody } from '../../shared/http/index.js';
import {
  CreateImportBatchSchema,
  ConfirmImportBatchSchema,
} from '../../shared/validation/index.js';
import { NotFoundError, AppError } from '../../shared/errors/index.js';
import { toPaise, generateTransactionFingerprint } from '../../shared/financial/index.js';
import { analyseTransaction } from '../../shared/categorisation/index.js';
import { ImportBatchRecord, TransactionRecord } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const user = getAuthenticatedUser(event);
    const method = event.requestContext.http.method.toUpperCase();
    const path = event.rawPath || event.requestContext.http.path;
    const importBatchId = event.pathParameters?.importBatchId;

    // 1. POST /imports: Create import batch & generate presigned S3 upload URL
    if (method === 'POST' && !path.includes('/confirm')) {
      const rawBody = parseJsonBody<unknown>(event.body);
      const validated = CreateImportBatchSchema.parse(rawBody);

      const batchId = `imp_${Date.now()}_${uuidv4().replace(/-/g, '').slice(0, 8)}`;
      const fileKey = `users/${user.userId}/imports/${batchId}/${uuidv4()}.csv`;

      // Generate secure 15-minute presigned upload URL
      const putCommand = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: fileKey,
        ContentType: 'text/csv',
        Metadata: {
          userId: user.userId,
          importBatchId: batchId,
        },
      });

      let uploadUrl = '';
      try {
        uploadUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 900 });
      } catch (e) {
        // Fallback for local mock environment
        uploadUrl = `https://${S3_BUCKET}.s3.amazonaws.com/${fileKey}?mock=true`;
      }

      const newBatch: ImportBatchRecord = {
        userId: user.userId,
        importBatchId: batchId,
        fileName: validated.fileName,
        fileType: validated.fileType,
        source: validated.source,
        status: 'pending',
        totalRecords: 0,
        acceptedRecords: 0,
        rejectedRecords: 0,
        duplicateRecords: 0,
        reviewRequiredRecords: 0,
        createdAt: new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLES.IMPORT_BATCHES,
          Item: newBatch,
        })
      );

      return successResponse(
        {
          importBatchId: batchId,
          uploadUrl,
          fileKey,
          status: 'pending',
          expiresInSeconds: 900,
        },
        201
      );
    }

    // 2. GET /imports/{importBatchId}
    if (method === 'GET' && importBatchId && !path.endsWith('/errors')) {
      const result = await docClient.send(
        new GetCommand({
          TableName: TABLES.IMPORT_BATCHES,
          Key: { userId: user.userId, importBatchId },
        })
      );
      if (!result.Item) throw new NotFoundError(`Import batch ${importBatchId} not found`);
      return successResponse(result.Item);
    }

    // 3. GET /imports/{importBatchId}/errors
    if (method === 'GET' && importBatchId && path.endsWith('/errors')) {
      const result = await docClient.send(
        new GetCommand({
          TableName: TABLES.IMPORT_BATCHES,
          Key: { userId: user.userId, importBatchId },
        })
      );
      if (!result.Item) throw new NotFoundError(`Import batch ${importBatchId} not found`);
      const batch = result.Item as ImportBatchRecord;

      return successResponse({
        importBatchId,
        rejectedRecords: batch.rejectedRecords,
        errorSummary: batch.errorSummary || [],
      });
    }

    // 4. POST /imports/{importBatchId}/confirm: Commit parsed and user-reviewed transactions
    if (method === 'POST' && importBatchId && path.endsWith('/confirm')) {
      const batchResult = await docClient.send(
        new GetCommand({
          TableName: TABLES.IMPORT_BATCHES,
          Key: { userId: user.userId, importBatchId },
        })
      );
      if (!batchResult.Item) throw new NotFoundError(`Import batch ${importBatchId} not found`);
      const batch = batchResult.Item as ImportBatchRecord;

      if (batch.status === 'completed') {
        throw new AppError(`Import batch ${importBatchId} is already completed.`, 400);
      }

      const rawBody = parseJsonBody<unknown>(event.body);
      const validated = ConfirmImportBatchSchema.parse(rawBody);

      const preparedTransactions: TransactionRecord[] = validated.transactions.map((t) => {
        const amountInPaise = toPaise(t.amount);
        const analysis = analyseTransaction({
          title: t.title,
          merchant: t.merchant,
          type: t.type,
          amount: t.amount,
          source: t.source,
          notes: t.notes,
        });

        const category = t.category && t.category !== 'Other' ? t.category : analysis.suggestedCategory;
        const transactionType = t.transactionType || analysis.suggestedTransactionType;

        return {
          userId: user.userId,
          transactionId: `tx_${Date.now()}_${uuidv4().replace(/-/g, '').slice(0, 8)}`,
          title: t.title,
          merchant: t.merchant,
          category,
          amount: t.amount,
          amountInPaise,
          type: t.type,
          transactionType,
          date: t.date,
          source: t.source,
          accountId: t.accountId,
          paymentMethod: t.paymentMethod,
          status: 'completed',
          upiRef: t.upiRef,
          notes: t.notes,
          isRecurring: t.isRecurring || false,
          importBatchId,
          fingerprint: generateTransactionFingerprint({
            date: t.date,
            amountInPaise,
            merchant: t.merchant,
            upiRef: t.upiRef,
            source: t.source,
          }),
          classificationConfidence: analysis.confidence,
          classificationReason: analysis.reason,
          needsReview: analysis.needsReview,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      // Batch write to DynamoDB
      for (let i = 0; i < preparedTransactions.length; i += 25) {
        const chunk = preparedTransactions.slice(i, i + 25);
        await docClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [TABLES.TRANSACTIONS]: chunk.map((item) => ({
                PutRequest: { Item: item },
              })),
            },
          })
        );
      }

      // Update batch record
      const updatedBatch: ImportBatchRecord = {
        ...batch,
        status: 'completed',
        totalRecords: validated.transactions.length,
        acceptedRecords: validated.transactions.length,
        completedAt: new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLES.IMPORT_BATCHES,
          Item: updatedBatch,
        })
      );

      return successResponse({
        success: true,
        importBatchId,
        committedCount: preparedTransactions.length,
        status: 'completed',
      });
    }

    // 5. DELETE /imports/{importBatchId}: Cancel uncommitted import batch
    if (method === 'DELETE' && importBatchId) {
      const batchResult = await docClient.send(
        new GetCommand({
          TableName: TABLES.IMPORT_BATCHES,
          Key: { userId: user.userId, importBatchId },
        })
      );
      if (!batchResult.Item) throw new NotFoundError(`Import batch ${importBatchId} not found`);

      await docClient.send(
        new DeleteCommand({
          TableName: TABLES.IMPORT_BATCHES,
          Key: { userId: user.userId, importBatchId },
        })
      );

      return successResponse({ success: true, cancelledImportBatchId: importBatchId });
    }

    return errorResponse(new Error(`Method ${method} on path ${path} not allowed`));
  } catch (err) {
    return errorResponse(err);
  }
}
