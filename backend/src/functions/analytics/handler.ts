import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '../../shared/db/index.js';
import { getAuthenticatedUser } from '../../shared/auth/index.js';
import { successResponse, errorResponse } from '../../shared/http/index.js';
import {
  calculateMonthlyCashflow,
  calculateWeeklyCashflow,
  CONSUMPTION_CATEGORIES,
} from '../../shared/financial/index.js';
import { TransactionRecord, InvestmentRecord, LoanRecord } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const user = getAuthenticatedUser(event);
    const path = event.rawPath || event.requestContext.http.path;

    // 1. GET /analytics/cashflow
    if (path.includes('/cashflow')) {
      const txResult = await docClient.send(
        new QueryCommand({
          TableName: TABLES.TRANSACTIONS,
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': user.userId },
        })
      );
      const transactions = (txResult.Items as TransactionRecord[]) || [];

      return successResponse({
        monthly: calculateMonthlyCashflow(transactions),
        weekly: calculateWeeklyCashflow(transactions),
      });
    }

    // 2. GET /analytics/categories
    if (path.includes('/categories')) {
      const txResult = await docClient.send(
        new QueryCommand({
          TableName: TABLES.TRANSACTIONS,
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': user.userId },
        })
      );
      const transactions = (txResult.Items as TransactionRecord[]) || [];

      const categoryTotals: Record<string, number> = {};
      let totalSpend = 0;

      for (const tx of transactions) {
        if (
          tx.status === 'completed' &&
          tx.type === 'debit' &&
          CONSUMPTION_CATEGORIES.includes(tx.category) &&
          tx.transactionType !== 'transfer'
        ) {
          categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
          totalSpend += tx.amount;
        }
      }

      const breakdown = Object.entries(categoryTotals).map(([category, amount]) => ({
        category,
        amount,
        percentage: totalSpend > 0 ? Math.round((amount / totalSpend) * 1000) / 10 : 0,
      }));

      return successResponse({
        totalSpend,
        categories: breakdown,
      });
    }

    // 3. GET /analytics/payment-sources
    if (path.includes('/payment-sources')) {
      const txResult = await docClient.send(
        new QueryCommand({
          TableName: TABLES.TRANSACTIONS,
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': user.userId },
        })
      );
      const transactions = (txResult.Items as TransactionRecord[]) || [];

      const sourceTotals: Record<string, { count: number; amount: number }> = {};
      for (const tx of transactions) {
        if (tx.status === 'completed' && tx.type === 'debit') {
          const src = tx.source || 'Other';
          if (!sourceTotals[src]) sourceTotals[src] = { count: 0, amount: 0 };
          sourceTotals[src].count++;
          sourceTotals[src].amount += tx.amount;
        }
      }

      const breakdown = Object.entries(sourceTotals).map(([source, stats]) => ({
        source,
        ...stats,
      }));

      return successResponse(breakdown);
    }

    // 4. GET /analytics/investments
    if (path.includes('/investments')) {
      const invResult = await docClient.send(
        new QueryCommand({
          TableName: TABLES.INVESTMENTS,
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': user.userId },
        })
      );
      const investments = (invResult.Items as InvestmentRecord[]) || [];

      const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
      const allocationByType: Record<string, number> = {};

      for (const inv of investments) {
        allocationByType[inv.type] = (allocationByType[inv.type] || 0) + inv.currentValue;
      }

      const allocation = Object.entries(allocationByType).map(([type, amount]) => ({
        type,
        amount,
        percentage: totalValue > 0 ? Math.round((amount / totalValue) * 1000) / 10 : 0,
      }));

      return successResponse({
        totalPortfolioValue: totalValue,
        allocation,
      });
    }

    // 5. GET /analytics/debt
    if (path.includes('/debt')) {
      const loanResult = await docClient.send(
        new QueryCommand({
          TableName: TABLES.LOANS,
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': user.userId },
        })
      );
      const loans = (loanResult.Items as LoanRecord[]) || [];

      const totalDebt = loans.reduce((sum, l) => sum + l.outstanding, 0);
      const totalMonthlyEMI = loans.reduce((sum, l) => sum + l.monthlyEMI, 0);

      const loansBreakdown = loans.map((l) => ({
        loanId: l.loanId,
        name: l.name,
        lender: l.lender,
        type: l.type,
        principal: l.principal,
        outstanding: l.outstanding,
        monthlyEMI: l.monthlyEMI,
        progress: l.principal > 0 ? Math.round(((l.principal - l.outstanding) / l.principal) * 100) : 0,
      }));

      return successResponse({
        totalOutstandingDebt: totalDebt,
        totalMonthlyObligation: totalMonthlyEMI,
        loans: loansBreakdown,
      });
    }

    return errorResponse(new Error(`Analytics path ${path} not recognized`));
  } catch (err) {
    return errorResponse(err);
  }
}
