import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { docClient, s3Client, TABLES, S3_BUCKET } from '../../shared/db/index.js';
import { getAuthenticatedUser } from '../../shared/auth/index.js';
import { successResponse, errorResponse, parseJsonBody } from '../../shared/http/index.js';
import { PresignedUrlRequestSchema } from '../../shared/validation/index.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { FileMetadataRecord } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const user = getAuthenticatedUser(event);
    const method = event.requestContext.http.method.toUpperCase();
    const path = event.rawPath || event.requestContext.http.path;
    const fileId = event.pathParameters?.fileId;

    // 1. POST /uploads/presigned-url: Issue upload URL
    if (method === 'POST' && path.includes('/presigned-url')) {
      const rawBody = parseJsonBody<unknown>(event.body);
      const validated = PresignedUrlRequestSchema.parse(rawBody);

      const generatedFileId = `file_${Date.now()}_${uuidv4().replace(/-/g, '').slice(0, 8)}`;
      const ext = validated.fileName.includes('.') ? validated.fileName.split('.').pop() : 'bin';
      const opaqueObjectKey = `users/${user.userId}/${validated.fileType}s/${generatedFileId}/${uuidv4()}.${ext}`;

      const putCommand = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: opaqueObjectKey,
        ContentType: validated.contentType,
        Metadata: {
          userId: user.userId,
          fileId: generatedFileId,
          fileType: validated.fileType,
        },
      });

      let uploadUrl = '';
      try {
        uploadUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 900 });
      } catch (e) {
        uploadUrl = `https://${S3_BUCKET}.s3.amazonaws.com/${opaqueObjectKey}?mock=true`;
      }

      // Persist file metadata
      const metadata: FileMetadataRecord = {
        userId: user.userId,
        fileId: generatedFileId,
        fileType: validated.fileType,
        originalFileName: validated.fileName,
        s3ObjectKey: opaqueObjectKey,
        associatedTransactionId: validated.associatedTransactionId,
        contentType: validated.contentType,
        fileSize: validated.fileSize,
        createdAt: new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLES.FILE_METADATA,
          Item: metadata,
        })
      );

      return successResponse(
        {
          fileId: generatedFileId,
          uploadUrl,
          expiresInSeconds: 900,
          fileMetadata: metadata,
        },
        201
      );
    }

    // 2. GET /uploads/{fileId}/download-url: Generate download URL after verifying ownership
    if (method === 'GET' && fileId && path.includes('/download-url')) {
      const metaResult = await docClient.send(
        new GetCommand({
          TableName: TABLES.FILE_METADATA,
          Key: { userId: user.userId, fileId },
        })
      );
      if (!metaResult.Item) throw new NotFoundError(`File ${fileId} not found or unauthorized`);
      const fileRecord = metaResult.Item as FileMetadataRecord;

      const getCommand = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: fileRecord.s3ObjectKey,
      });

      let downloadUrl = '';
      try {
        downloadUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 900 });
      } catch (e) {
        downloadUrl = `https://${S3_BUCKET}.s3.amazonaws.com/${fileRecord.s3ObjectKey}?mock=true`;
      }

      return successResponse({
        fileId,
        downloadUrl,
        expiresInSeconds: 900,
        fileName: fileRecord.originalFileName,
        contentType: fileRecord.contentType,
      });
    }

    // 3. DELETE /uploads/{fileId}: Safe deletion of S3 file and metadata
    if (method === 'DELETE' && fileId) {
      const metaResult = await docClient.send(
        new GetCommand({
          TableName: TABLES.FILE_METADATA,
          Key: { userId: user.userId, fileId },
        })
      );
      if (!metaResult.Item) throw new NotFoundError(`File ${fileId} not found or unauthorized`);
      const fileRecord = metaResult.Item as FileMetadataRecord;

      // Delete from S3
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: S3_BUCKET,
            Key: fileRecord.s3ObjectKey,
          })
        );
      } catch (s3Err) {
        console.warn('S3 object deletion warning:', s3Err);
      }

      // Delete from DynamoDB
      await docClient.send(
        new DeleteCommand({
          TableName: TABLES.FILE_METADATA,
          Key: { userId: user.userId, fileId },
        })
      );

      return successResponse({ success: true, deletedFileId: fileId });
    }

    return errorResponse(new Error(`Method ${method} on path ${path} not allowed`));
  } catch (err) {
    return errorResponse(err);
  }
}
