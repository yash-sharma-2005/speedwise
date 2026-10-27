import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { QueryCommand, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLES } from '../../shared/db/index.js';
import { getAuthenticatedUser } from '../../shared/auth/index.js';
import { successResponse, errorResponse, parseJsonBody } from '../../shared/http/index.js';
import { CreateAccountSchema, UpdateAccountSchema } from '../../shared/validation/index.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { AccountRecord } from '../../types/index.js';
import { toPaise } from '../../shared/financial/index.js';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const user = getAuthenticatedUser(event);
    const method = event.requestContext.http.method.toUpperCase();
    const accountId = event.pathParameters?.accountId;

    if (method === 'GET') {
      if (accountId) {
        const result = await docClient.send(
          new GetCommand({
            TableName: TABLES.ACCOUNTS,
            Key: { userId: user.userId, accountId },
          })
        );
        if (!result.Item) throw new NotFoundError(`Account ${accountId} not found`);
        return successResponse(result.Item);
      }

      // Query all accounts belonging to authenticated user
      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLES.ACCOUNTS,
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': user.userId },
        })
      );
      return successResponse(result.Items || []);
    }

    if (method === 'POST') {
      const rawBody = parseJsonBody<unknown>(event.body);
      const validated = CreateAccountSchema.parse(rawBody);

      const newAccount: AccountRecord = {
        userId: user.userId,
        accountId: `acc_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
        displayName: validated.displayName,
        accountType: validated.accountType,
        providerName: validated.providerName,
        sourceType: validated.sourceType,
        currency: validated.currency,
        maskedIdentifier: validated.maskedIdentifier,
        openingBalance: validated.openingBalance,
        openingBalanceInPaise: toPaise(validated.openingBalance || 0),
        status: validated.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLES.ACCOUNTS,
          Item: newAccount,
        })
      );

      return successResponse(newAccount, 201);
    }

    if (method === 'PUT') {
      if (!accountId) throw new NotFoundError('AccountId is required in path');
      const existing = await docClient.send(
        new GetCommand({
          TableName: TABLES.ACCOUNTS,
          Key: { userId: user.userId, accountId },
        })
      );
      if (!existing.Item) throw new NotFoundError(`Account ${accountId} not found`);

      const rawBody = parseJsonBody<unknown>(event.body);
      const validated = UpdateAccountSchema.parse(rawBody);

      const updatedAccount: AccountRecord = {
        ...(existing.Item as AccountRecord),
        ...validated,
        userId: user.userId,
        accountId,
        ...(validated.openingBalance !== undefined
          ? { openingBalanceInPaise: toPaise(validated.openingBalance) }
          : {}),
        updatedAt: new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLES.ACCOUNTS,
          Item: updatedAccount,
        })
      );

      return successResponse(updatedAccount);
    }

    if (method === 'DELETE') {
      if (!accountId) throw new NotFoundError('AccountId is required in path');
      const existing = await docClient.send(
        new GetCommand({
          TableName: TABLES.ACCOUNTS,
          Key: { userId: user.userId, accountId },
        })
      );
      if (!existing.Item) throw new NotFoundError(`Account ${accountId} not found`);

      await docClient.send(
        new DeleteCommand({
          TableName: TABLES.ACCOUNTS,
          Key: { userId: user.userId, accountId },
        })
      );

      return successResponse({ success: true, deletedAccountId: accountId });
    }

    return errorResponse(new Error(`Method ${method} not allowed`));
  } catch (err) {
    return errorResponse(err);
  }
}
