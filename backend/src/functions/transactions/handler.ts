import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import {
  QueryCommand,
  GetCommand,
  PutCommand,
  DeleteCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLES, encodeNextToken, decodeNextToken } from '../../shared/db/index.js';
import { getAuthenticatedUser } from '../../shared/auth/index.js';
import { successResponse, errorResponse, parseJsonBody } from '../../shared/http/index.js';
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  BatchTransactionsSchema,
} from '../../shared/validation/index.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { toPaise, generateTransactionFingerprint } from '../../shared/financial/index.js';
import { analyseTransaction } from '../../shared/categorisation/index.js';
import { TransactionRecord, PaginatedResult } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const user = getAuthenticatedUser(event);
    const method = event.requestContext.http.method.toUpperCase();
    const path = event.rawPath || event.requestContext.http.path;
    const transactionId = event.pathParameters?.transactionId;

    // Handle batch creation: POST /transactions/batch
    if (method === 'POST' && path.endsWith('/batch')) {
      const rawBody = parseJsonBody<unknown>(event.body);
      const validated = BatchTransactionsSchema.parse(rawBody);

      const accepted: TransactionRecord[] = [];
      const rejected: { index: number; reason: string }[] = [];
      const duplicates: { index: number; title: string; fingerprint: string }[] = [];
      const reviewRequired: TransactionRecord[] = [];

      // Fetch user custom rules for categorisation
      const userRulesResult = await docClient.send(
        new QueryCommand({
          TableName: TABLES.TRANSACTION_RULES,
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': user.userId },
        })
      );
      const userRules = (userRulesResult.Items as any[]) || [];

      // Build prepared items
      const preparedRecords: TransactionRecord[] = [];

      for (let i = 0; i < validated.transactions.length; i++) {
        const item = validated.transactions[i];
        try {
          const amountInPaise = toPaise(item.amount);
          const fingerprint = generateTransactionFingerprint({
            date: item.date,
            amountInPaise,
            merchant: item.merchant,
            upiRef: item.upiRef,
            source: item.source,
          });

          // Check if duplicate fingerprint already exists in transactions
          const existingFp = await docClient.send(
            new QueryCommand({
              TableName: TABLES.TRANSACTIONS,
              IndexName: 'userId-fingerprint-index',
              KeyConditionExpression: 'userId = :uid AND fingerprint = :fp',
              ExpressionAttributeValues: {
                ':uid': user.userId,
                ':fp': fingerprint,
              },
              Limit: 1,
            })
          );

          const isDuplicate = (existingFp.Items && existingFp.Items.length > 0) || false;
          if (isDuplicate) {
            duplicates.push({ index: i, title: item.title, fingerprint });
          }

          // Run smart categorisation if not already provided or is 'Other'
          const analysis = analyseTransaction({
            title: item.title,
            merchant: item.merchant,
            type: item.type,
            amount: item.amount,
            source: item.source,
            notes: item.notes,
            userRules,
          });

          const category = item.category && item.category !== 'Other' ? item.category : analysis.suggestedCategory;
          const transactionType = item.transactionType || analysis.suggestedTransactionType;

          const record: TransactionRecord = {
            userId: user.userId,
            transactionId: `tx_${Date.now()}_${uuidv4().replace(/-/g, '').slice(0, 8)}`,
            title: item.title,
            merchant: item.merchant,
            category,
            amount: item.amount,
            amountInPaise,
            type: item.type,
            transactionType,
            date: item.date,
            source: item.source,
            accountId: item.accountId,
            paymentMethod: item.paymentMethod,
            status: item.status || 'completed',
            upiRef: item.upiRef,
            notes: item.notes,
            isRecurring: item.isRecurring || false,
            importBatchId: validated.importBatchId,
            fingerprint,
            classificationConfidence: analysis.confidence,
            classificationReason: analysis.reason,
            needsReview: analysis.needsReview,
            isDuplicate,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          if (analysis.needsReview) {
            reviewRequired.push(record);
          }

          preparedRecords.push(record);
          accepted.push(record);
        } catch (err: any) {
          rejected.push({ index: i, reason: err.message || 'Validation error' });
        }
      }

      // Write in chunks of 25 using DynamoDB BatchWriteCommand
      for (let i = 0; i < preparedRecords.length; i += 25) {
        const chunk = preparedRecords.slice(i, i + 25);
        let putRequests = chunk.map((tx) => ({
          PutRequest: { Item: tx },
        }));

        let attempts = 0;
        while (putRequests.length > 0 && attempts < 3) {
          attempts++;
          const batchResult = await docClient.send(
            new BatchWriteCommand({
              RequestItems: {
                [TABLES.TRANSACTIONS]: putRequests,
              },
            })
          );

          const unprocessed = batchResult.UnprocessedItems?.[TABLES.TRANSACTIONS];
          if (unprocessed && unprocessed.length > 0) {
            putRequests = unprocessed as any;
            await new Promise((resolve) => setTimeout(resolve, attempts * 100));
          } else {
            putRequests = [];
          }
        }
      }

      return successResponse(
        {
          totalSubmitted: validated.transactions.length,
          acceptedCount: accepted.length,
          rejectedCount: rejected.length,
          duplicateCount: duplicates.length,
          reviewRequiredCount: reviewRequired.length,
          accepted,
          rejected,
          duplicates,
          reviewRequired,
        },
        201
      );
    }

    // 1. GET /transactions or GET /transactions/{id}
    if (method === 'GET') {
      if (transactionId) {
        const result = await docClient.send(
          new GetCommand({
            TableName: TABLES.TRANSACTIONS,
            Key: { userId: user.userId, transactionId },
          })
        );
        if (!result.Item) throw new NotFoundError(`Transaction ${transactionId} not found`);
        return successResponse(result.Item);
      }

      // List with query params
      const qp = event.queryStringParameters || {};
      const limit = Math.min(100, Math.max(1, parseInt(qp.limit || '50', 10)));
      const exclusiveStartKey = decodeNextToken(qp.nextToken);

      let keyCondition = 'userId = :uid';
      const expressionValues: Record<string, unknown> = { ':uid': user.userId };
      const filterExpressions: string[] = [];

      // Query by date index or base table
      let indexName: string | undefined = undefined;

      if (qp.startDate && qp.endDate) {
        indexName = 'userId-date-index';
        keyCondition = 'userId = :uid AND #date BETWEEN :start AND :end';
        expressionValues[':start'] = qp.startDate;
        expressionValues[':end'] = qp.endDate;
      } else if (qp.startDate) {
        indexName = 'userId-date-index';
        keyCondition = 'userId = :uid AND #date >= :start';
        expressionValues[':start'] = qp.startDate;
      } else if (qp.category) {
        indexName = 'userId-category-date-index';
        keyCondition = 'userId = :uid AND begins_with(#catDate, :cat)';
        expressionValues[':cat'] = `${qp.category}#`;
      }

      const expressionNames: Record<string, string> = {};
      if (keyCondition.includes('#date')) expressionNames['#date'] = 'date';
      if (keyCondition.includes('#catDate')) expressionNames['#catDate'] = 'categoryDate';

      // Additional in-query filters
      if (qp.category && !keyCondition.includes('#catDate')) {
        filterExpressions.push('category = :category');
        expressionValues[':category'] = qp.category;
      }
      if (qp.type) {
        filterExpressions.push('#type = :type');
        expressionNames['#type'] = 'type';
        expressionValues[':type'] = qp.type;
      }
      if (qp.accountId) {
        filterExpressions.push('accountId = :accountId');
        expressionValues[':accountId'] = qp.accountId;
      }
      if (qp.status) {
        filterExpressions.push('#status = :status');
        expressionNames['#status'] = 'status';
        expressionValues[':status'] = qp.status;
      }

      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLES.TRANSACTIONS,
          ...(indexName ? { IndexName: indexName } : {}),
          KeyConditionExpression: keyCondition,
          ...(filterExpressions.length > 0 ? { FilterExpression: filterExpressions.join(' AND ') } : {}),
          ...(Object.keys(expressionNames).length > 0 ? { ExpressionAttributeNames: expressionNames } : {}),
          ExpressionAttributeValues: expressionValues,
          Limit: limit,
          ExclusiveStartKey: exclusiveStartKey,
          ScanIndexForward: false, // Descending order (newest first)
        })
      );

      const paginated: PaginatedResult<TransactionRecord> = {
        items: (result.Items as TransactionRecord[]) || [],
        nextToken: encodeNextToken(result.LastEvaluatedKey),
      };

      return successResponse(paginated);
    }

    // 2. POST /transactions (Single)
    if (method === 'POST') {
      const rawBody = parseJsonBody<unknown>(event.body);
      const validated = CreateTransactionSchema.parse(rawBody);

      const amountInPaise = toPaise(validated.amount);
      const fingerprint = generateTransactionFingerprint({
        date: validated.date,
        amountInPaise,
        merchant: validated.merchant,
        upiRef: validated.upiRef,
        source: validated.source,
      });

      // Analyze categorization
      const analysis = analyseTransaction({
        title: validated.title,
        merchant: validated.merchant,
        type: validated.type,
        amount: validated.amount,
        source: validated.source,
        notes: validated.notes,
      });

      const category = validated.category && validated.category !== 'Other' ? validated.category : analysis.suggestedCategory;
      const transactionType = validated.transactionType || analysis.suggestedTransactionType;

      const newTx: TransactionRecord = {
        userId: user.userId,
        transactionId: `tx_${Date.now()}_${uuidv4().replace(/-/g, '').slice(0, 8)}`,
        title: validated.title,
        merchant: validated.merchant,
        category,
        amount: validated.amount,
        amountInPaise,
        type: validated.type,
        transactionType,
        date: validated.date,
        source: validated.source,
        accountId: validated.accountId,
        paymentMethod: validated.paymentMethod,
        status: validated.status || 'completed',
        upiRef: validated.upiRef,
        notes: validated.notes,
        isRecurring: validated.isRecurring || false,
        fingerprint,
        classificationConfidence: analysis.confidence,
        classificationReason: analysis.reason,
        needsReview: analysis.needsReview,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLES.TRANSACTIONS,
          Item: newTx,
        })
      );

      return successResponse(newTx, 201);
    }

    // 3. PUT /transactions/{id}
    if (method === 'PUT') {
      if (!transactionId) throw new NotFoundError('Transaction ID is required in path');

      const existing = await docClient.send(
        new GetCommand({
          TableName: TABLES.TRANSACTIONS,
          Key: { userId: user.userId, transactionId },
        })
      );
      if (!existing.Item) throw new NotFoundError(`Transaction ${transactionId} not found`);

      const rawBody = parseJsonBody<unknown>(event.body);
      const validated = UpdateTransactionSchema.parse(rawBody);

      const current = existing.Item as TransactionRecord;
      const updatedAmount = validated.amount !== undefined ? validated.amount : current.amount;
      const amountInPaise = toPaise(updatedAmount);

      const updatedDate = validated.date || current.date;
      const updatedMerchant = validated.merchant || current.merchant;
      const updatedUpiRef = validated.upiRef !== undefined ? validated.upiRef : current.upiRef;

      const fingerprint = generateTransactionFingerprint({
        date: updatedDate,
        amountInPaise,
        merchant: updatedMerchant,
        upiRef: updatedUpiRef,
        source: validated.source || current.source,
      });

      const updatedTx: TransactionRecord = {
        ...current,
        ...validated,
        userId: user.userId,
        transactionId,
        amount: updatedAmount,
        amountInPaise,
        fingerprint,
        updatedAt: new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLES.TRANSACTIONS,
          Item: updatedTx,
        })
      );

      return successResponse(updatedTx);
    }

    // 4. DELETE /transactions/{id}
    if (method === 'DELETE') {
      if (!transactionId) throw new NotFoundError('Transaction ID is required in path');

      const existing = await docClient.send(
        new GetCommand({
          TableName: TABLES.TRANSACTIONS,
          Key: { userId: user.userId, transactionId },
        })
      );
      if (!existing.Item) throw new NotFoundError(`Transaction ${transactionId} not found`);

      await docClient.send(
        new DeleteCommand({
          TableName: TABLES.TRANSACTIONS,
          Key: { userId: user.userId, transactionId },
        })
      );

      return successResponse({ success: true, deletedTransactionId: transactionId });
    }

    return errorResponse(new Error(`Method ${method} not allowed`));
  } catch (err) {
    return errorResponse(err);
  }
}
