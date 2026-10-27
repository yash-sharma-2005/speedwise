import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { QueryCommand, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLES } from '../../shared/db/index.js';
import { getAuthenticatedUser } from '../../shared/auth/index.js';
import { successResponse, errorResponse, parseJsonBody } from '../../shared/http/index.js';
import { CreateBudgetSchema, UpdateBudgetSchema } from '../../shared/validation/index.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { toPaise, CONSUMPTION_CATEGORIES } from '../../shared/financial/index.js';
import { BudgetRecord, TransactionRecord } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const user = getAuthenticatedUser(event);
    const method = event.requestContext.http.method.toUpperCase();
    const path = event.rawPath || event.requestContext.http.path;
    const budgetId = event.pathParameters?.budgetId;

    // GET /budgets/summary: dynamically calculate actual spent for the period
    if (method === 'GET' && path.endsWith('/summary')) {
      const qp = event.queryStringParameters || {};
      const requestedPeriod = qp.period || 'October 2026';

      // 1. Fetch budgets for user
      const budgetResult = await docClient.send(
        new QueryCommand({
          TableName: TABLES.BUDGETS,
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': user.userId },
        })
      );
      const userBudgets = (budgetResult.Items as BudgetRecord[]) || [];

      // 2. Query transactions for user
      const txResult = await docClient.send(
        new QueryCommand({
          TableName: TABLES.TRANSACTIONS,
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': user.userId },
        })
      );
      const transactions = (txResult.Items as TransactionRecord[]) || [];

      // 3. Compute actual spent per category for eligible consumption expenses
      const spentByCategory: Record<string, number> = {};
      for (const tx of transactions) {
        if (
          tx.status === 'completed' &&
          tx.type === 'debit' &&
          CONSUMPTION_CATEGORIES.includes(tx.category) &&
          tx.transactionType !== 'transfer'
        ) {
          spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + tx.amount;
        }
      }

      // 4. Merge budgets with calculated spent
      const summaryItems = userBudgets.map((b) => {
        const actualSpent = spentByCategory[b.category] !== undefined ? spentByCategory[b.category] : b.spent;
        return {
          ...b,
          spent: actualSpent,
          remaining: Math.max(0, b.monthlyLimit - actualSpent),
          utilizationPercentage: b.monthlyLimit > 0 ? Math.round((actualSpent / b.monthlyLimit) * 100) : 0,
        };
      });

      return successResponse({
        period: requestedPeriod,
        totalBudgeted: summaryItems.reduce((acc, b) => acc + b.monthlyLimit, 0),
        totalSpent: summaryItems.reduce((acc, b) => acc + b.spent, 0),
        budgets: summaryItems,
      });
    }

    if (method === 'GET') {
      if (budgetId) {
        const result = await docClient.send(
          new GetCommand({
            TableName: TABLES.BUDGETS,
            Key: { userId: user.userId, budgetId },
          })
        );
        if (!result.Item) throw new NotFoundError(`Budget ${budgetId} not found`);
        return successResponse(result.Item);
      }

      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLES.BUDGETS,
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': user.userId },
        })
      );
      return successResponse(result.Items || []);
    }

    if (method === 'POST') {
      const rawBody = parseJsonBody<unknown>(event.body);
      const validated = CreateBudgetSchema.parse(rawBody);

      const newBudget: BudgetRecord = {
        userId: user.userId,
        budgetId: `bgt_${Date.now()}_${uuidv4().replace(/-/g, '').slice(0, 6)}`,
        category: validated.category,
        monthlyLimit: validated.monthlyLimit,
        monthlyLimitInPaise: toPaise(validated.monthlyLimit),
        spent: 0,
        period: validated.period,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLES.BUDGETS,
          Item: newBudget,
        })
      );

      return successResponse(newBudget, 201);
    }

    if (method === 'PUT') {
      if (!budgetId) throw new NotFoundError('Budget ID is required in path');

      const existing = await docClient.send(
        new GetCommand({
          TableName: TABLES.BUDGETS,
          Key: { userId: user.userId, budgetId },
        })
      );
      if (!existing.Item) throw new NotFoundError(`Budget ${budgetId} not found`);

      const rawBody = parseJsonBody<unknown>(event.body);
      const validated = UpdateBudgetSchema.parse(rawBody);

      const current = existing.Item as BudgetRecord;
      const monthlyLimit = validated.monthlyLimit !== undefined ? validated.monthlyLimit : current.monthlyLimit;

      const updatedBudget: BudgetRecord = {
        ...current,
        monthlyLimit,
        monthlyLimitInPaise: toPaise(monthlyLimit),
        period: validated.period || current.period,
        updatedAt: new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLES.BUDGETS,
          Item: updatedBudget,
        })
      );

      return successResponse(updatedBudget);
    }

    if (method === 'DELETE') {
      if (!budgetId) throw new NotFoundError('Budget ID is required in path');

      const existing = await docClient.send(
        new GetCommand({
          TableName: TABLES.BUDGETS,
          Key: { userId: user.userId, budgetId },
        })
      );
      if (!existing.Item) throw new NotFoundError(`Budget ${budgetId} not found`);

      await docClient.send(
        new DeleteCommand({
          TableName: TABLES.BUDGETS,
          Key: { userId: user.userId, budgetId },
        })
      );

      return successResponse({ success: true, deletedBudgetId: budgetId });
    }

    return errorResponse(new Error(`Method ${method} not allowed`));
  } catch (err) {
    return errorResponse(err);
  }
}
