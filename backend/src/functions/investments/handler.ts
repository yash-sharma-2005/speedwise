import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { QueryCommand, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLES } from '../../shared/db/index.js';
import { getAuthenticatedUser } from '../../shared/auth/index.js';
import { successResponse, errorResponse, parseJsonBody } from '../../shared/http/index.js';
import { CreateInvestmentSchema, UpdateInvestmentSchema } from '../../shared/validation/index.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { toPaise } from '../../shared/financial/index.js';
import { InvestmentRecord } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const user = getAuthenticatedUser(event);
    const method = event.requestContext.http.method.toUpperCase();
    const investmentId = event.pathParameters?.investmentId;

    if (method === 'GET') {
      if (investmentId) {
        const result = await docClient.send(
          new GetCommand({
            TableName: TABLES.INVESTMENTS,
            Key: { userId: user.userId, investmentId },
          })
        );
        if (!result.Item) throw new NotFoundError(`Investment ${investmentId} not found`);
        return successResponse(result.Item);
      }

      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLES.INVESTMENTS,
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': user.userId },
        })
      );
      return successResponse(result.Items || []);
    }

    if (method === 'POST') {
      const rawBody = parseJsonBody<unknown>(event.body);
      const validated = CreateInvestmentSchema.parse(rawBody);

      const returns = validated.returns !== undefined ? validated.returns : validated.currentValue - validated.investedAmount;
      const returnPercentage = validated.returnPercentage !== undefined
        ? validated.returnPercentage
        : validated.investedAmount > 0
        ? Math.round((returns / validated.investedAmount) * 1000) / 10
        : 0;

      const newInvestment: InvestmentRecord = {
        userId: user.userId,
        investmentId: `inv_${Date.now()}_${uuidv4().replace(/-/g, '').slice(0, 6)}`,
        name: validated.name,
        type: validated.type,
        platform: validated.platform,
        accountId: validated.accountId,
        investedAmount: validated.investedAmount,
        investedAmountInPaise: toPaise(validated.investedAmount),
        currentValue: validated.currentValue,
        currentValueInPaise: toPaise(validated.currentValue),
        returns,
        returnPercentage,
        monthlySIP: validated.monthlySIP,
        nextDebitDate: validated.nextDebitDate,
        allocationPercentage: validated.allocationPercentage || 0,
        valuationDate: validated.valuationDate || new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLES.INVESTMENTS,
          Item: newInvestment,
        })
      );

      return successResponse(newInvestment, 201);
    }

    if (method === 'PUT') {
      if (!investmentId) throw new NotFoundError('Investment ID is required in path');

      const existing = await docClient.send(
        new GetCommand({
          TableName: TABLES.INVESTMENTS,
          Key: { userId: user.userId, investmentId },
        })
      );
      if (!existing.Item) throw new NotFoundError(`Investment ${investmentId} not found`);

      const rawBody = parseJsonBody<unknown>(event.body);
      const validated = UpdateInvestmentSchema.parse(rawBody);

      const current = existing.Item as InvestmentRecord;
      const investedAmount = validated.investedAmount !== undefined ? validated.investedAmount : current.investedAmount;
      const currentValue = validated.currentValue !== undefined ? validated.currentValue : current.currentValue;

      const returns = validated.returns !== undefined ? validated.returns : currentValue - investedAmount;
      const returnPercentage = validated.returnPercentage !== undefined
        ? validated.returnPercentage
        : investedAmount > 0
        ? Math.round((returns / investedAmount) * 1000) / 10
        : 0;

      const updatedInv: InvestmentRecord = {
        ...current,
        ...validated,
        userId: user.userId,
        investmentId,
        investedAmount,
        investedAmountInPaise: toPaise(investedAmount),
        currentValue,
        currentValueInPaise: toPaise(currentValue),
        returns,
        returnPercentage,
        updatedAt: new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLES.INVESTMENTS,
          Item: updatedInv,
        })
      );

      return successResponse(updatedInv);
    }

    if (method === 'DELETE') {
      if (!investmentId) throw new NotFoundError('Investment ID is required in path');

      const existing = await docClient.send(
        new GetCommand({
          TableName: TABLES.INVESTMENTS,
          Key: { userId: user.userId, investmentId },
        })
      );
      if (!existing.Item) throw new NotFoundError(`Investment ${investmentId} not found`);

      await docClient.send(
        new DeleteCommand({
          TableName: TABLES.INVESTMENTS,
          Key: { userId: user.userId, investmentId },
        })
      );

      return successResponse({ success: true, deletedInvestmentId: investmentId });
    }

    return errorResponse(new Error(`Method ${method} not allowed`));
  } catch (err) {
    return errorResponse(err);
  }
}
