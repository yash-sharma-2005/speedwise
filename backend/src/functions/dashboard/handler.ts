import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '../../shared/db/index.js';
import { getAuthenticatedUser } from '../../shared/auth/index.js';
import { successResponse, errorResponse } from '../../shared/http/index.js';
import { calculateFinancialSummary } from '../../shared/financial/index.js';
import { TransactionRecord, InvestmentRecord, LoanRecord } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const user = getAuthenticatedUser(event);

    // Parallel fetch of user data collections
    const [txResult, invResult, loanResult] = await Promise.all([
      docClient.send(
        new QueryCommand({
          TableName: TABLES.TRANSACTIONS,
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': user.userId },
        })
      ),
      docClient.send(
        new QueryCommand({
          TableName: TABLES.INVESTMENTS,
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': user.userId },
        })
      ),
      docClient.send(
        new QueryCommand({
          TableName: TABLES.LOANS,
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': user.userId },
        })
      ),
    ]);

    const transactions = (txResult.Items as TransactionRecord[]) || [];
    const investments = (invResult.Items as InvestmentRecord[]) || [];
    const loans = (loanResult.Items as LoanRecord[]) || [];

    const summary = calculateFinancialSummary(transactions, investments, loans);

    return successResponse(summary);
  } catch (err) {
    return errorResponse(err);
  }
}
