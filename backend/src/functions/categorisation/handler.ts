import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { QueryCommand, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLES } from '../../shared/db/index.js';
import { getAuthenticatedUser } from '../../shared/auth/index.js';
import { successResponse, errorResponse, parseJsonBody } from '../../shared/http/index.js';
import {
  AnalyseTransactionSchema,
  CategoriseTransactionSchema,
  CreateTransactionRuleSchema,
  UpdateTransactionRuleSchema,
} from '../../shared/validation/index.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { analyseTransaction } from '../../shared/categorisation/index.js';
import { TransactionRecord, TransactionRuleRecord } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const user = getAuthenticatedUser(event);
    const method = event.requestContext.http.method.toUpperCase();
    const path = event.rawPath || event.requestContext.http.path;
    const ruleId = event.pathParameters?.ruleId;
    const transactionId = event.pathParameters?.transactionId;

    // 1. POST /transactions/analyse
    if (method === 'POST' && path.endsWith('/analyse')) {
      const rawBody = parseJsonBody<unknown>(event.body);
      const validated = AnalyseTransactionSchema.parse(rawBody);

      // Fetch user's custom rules
      const userRulesResult = await docClient.send(
        new QueryCommand({
          TableName: TABLES.TRANSACTION_RULES,
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': user.userId },
        })
      );
      const userRules = (userRulesResult.Items as TransactionRuleRecord[]) || [];

      const analysis = analyseTransaction({
        title: validated.title,
        merchant: validated.merchant,
        type: validated.type,
        amount: validated.amount,
        source: validated.source,
        notes: validated.notes,
        userRules,
      });

      return successResponse(analysis);
    }

    // 2. POST /transactions/{transactionId}/categorise
    if (method === 'POST' && transactionId && path.includes('/categorise')) {
      const rawBody = parseJsonBody<unknown>(event.body);
      const validated = CategoriseTransactionSchema.parse(rawBody);

      // Verify transaction exists and belongs to user
      const existing = await docClient.send(
        new GetCommand({
          TableName: TABLES.TRANSACTIONS,
          Key: { userId: user.userId, transactionId },
        })
      );
      if (!existing.Item) throw new NotFoundError(`Transaction ${transactionId} not found`);

      const current = existing.Item as TransactionRecord;
      const updatedTx: TransactionRecord = {
        ...current,
        category: validated.category,
        transactionType: validated.transactionType || current.transactionType,
        needsReview: false,
        classificationConfidence: 1.0,
        classificationReason: 'Manually verified and confirmed by user.',
        updatedAt: new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLES.TRANSACTIONS,
          Item: updatedTx,
        })
      );

      // Optionally save user merchant rule for future auto-categorisation
      if (validated.saveMerchantRule && current.merchant && current.merchant.length > 2) {
        const rule: TransactionRuleRecord = {
          userId: user.userId,
          ruleId: `rule_${uuidv4().replace(/-/g, '').slice(0, 10)}`,
          merchantPattern: current.merchant.trim(),
          category: validated.category,
          transactionType: validated.transactionType || current.transactionType,
          priority: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await docClient.send(
          new PutCommand({
            TableName: TABLES.TRANSACTION_RULES,
            Item: rule,
          })
        );
      }

      return successResponse(updatedTx);
    }

    // 3. User Categorisation Rules: /transaction-rules
    if (path.includes('transaction-rules')) {
      if (method === 'GET') {
        const result = await docClient.send(
          new QueryCommand({
            TableName: TABLES.TRANSACTION_RULES,
            KeyConditionExpression: 'userId = :uid',
            ExpressionAttributeValues: { ':uid': user.userId },
          })
        );
        return successResponse(result.Items || []);
      }

      if (method === 'POST') {
        const rawBody = parseJsonBody<unknown>(event.body);
        const validated = CreateTransactionRuleSchema.parse(rawBody);

        const newRule: TransactionRuleRecord = {
          userId: user.userId,
          ruleId: `rule_${uuidv4().replace(/-/g, '').slice(0, 10)}`,
          merchantPattern: validated.merchantPattern.trim(),
          category: validated.category,
          transactionType: validated.transactionType,
          priority: validated.priority,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await docClient.send(
          new PutCommand({
            TableName: TABLES.TRANSACTION_RULES,
            Item: newRule,
          })
        );

        return successResponse(newRule, 201);
      }

      if (method === 'PUT') {
        if (!ruleId) throw new NotFoundError('Rule ID required in path');

        const existing = await docClient.send(
          new GetCommand({
            TableName: TABLES.TRANSACTION_RULES,
            Key: { userId: user.userId, ruleId },
          })
        );
        if (!existing.Item) throw new NotFoundError(`Rule ${ruleId} not found`);

        const rawBody = parseJsonBody<unknown>(event.body);
        const validated = UpdateTransactionRuleSchema.parse(rawBody);

        const updatedRule: TransactionRuleRecord = {
          ...(existing.Item as TransactionRuleRecord),
          ...validated,
          userId: user.userId,
          ruleId,
          updatedAt: new Date().toISOString(),
        };

        await docClient.send(
          new PutCommand({
            TableName: TABLES.TRANSACTION_RULES,
            Item: updatedRule,
          })
        );

        return successResponse(updatedRule);
      }

      if (method === 'DELETE') {
        if (!ruleId) throw new NotFoundError('Rule ID required in path');

        const existing = await docClient.send(
          new GetCommand({
            TableName: TABLES.TRANSACTION_RULES,
            Key: { userId: user.userId, ruleId },
          })
        );
        if (!existing.Item) throw new NotFoundError(`Rule ${ruleId} not found`);

        await docClient.send(
          new DeleteCommand({
            TableName: TABLES.TRANSACTION_RULES,
            Key: { userId: user.userId, ruleId },
          })
        );

        return successResponse({ success: true, deletedRuleId: ruleId });
      }
    }

    return errorResponse(new Error(`Method ${method} on path ${path} not allowed`));
  } catch (err) {
    return errorResponse(err);
  }
}
