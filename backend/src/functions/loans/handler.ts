import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { QueryCommand, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLES } from '../../shared/db/index.js';
import { getAuthenticatedUser } from '../../shared/auth/index.js';
import { successResponse, errorResponse, parseJsonBody } from '../../shared/http/index.js';
import {
  CreateLoanSchema,
  UpdateLoanSchema,
  CreateLoanRepaymentSchema,
} from '../../shared/validation/index.js';
import { NotFoundError, ConflictError } from '../../shared/errors/index.js';
import { toPaise } from '../../shared/financial/index.js';
import { LoanRecord, LoanRepaymentRecord } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const user = getAuthenticatedUser(event);
    const method = event.requestContext.http.method.toUpperCase();
    const path = event.rawPath || event.requestContext.http.path;
    const loanId = event.pathParameters?.loanId;

    // Handle Repayments sub-resource: /loans/{loanId}/repayments
    if (path.includes('/repayments') && loanId) {
      // Validate loan exists and belongs to user
      const loanResult = await docClient.send(
        new GetCommand({
          TableName: TABLES.LOANS,
          Key: { userId: user.userId, loanId },
        })
      );
      if (!loanResult.Item) throw new NotFoundError(`Loan ${loanId} not found`);
      const loan = loanResult.Item as LoanRecord;

      if (method === 'GET') {
        const repayments = await docClient.send(
          new QueryCommand({
            TableName: TABLES.LOAN_REPAYMENTS,
            IndexName: 'loanId-paymentDate-index',
            KeyConditionExpression: 'loanId = :lid',
            ExpressionAttributeValues: { ':lid': loanId },
          })
        );
        return successResponse(repayments.Items || []);
      }

      if (method === 'POST') {
        const rawBody = parseJsonBody<unknown>(event.body);
        const validated = CreateLoanRepaymentSchema.parse(rawBody);

        // Deduplication check: check if a repayment for same loan on same date with same amount exists
        const existingRepayments = await docClient.send(
          new QueryCommand({
            TableName: TABLES.LOAN_REPAYMENTS,
            IndexName: 'loanId-paymentDate-index',
            KeyConditionExpression: 'loanId = :lid AND paymentDate = :pdate',
            ExpressionAttributeValues: {
              ':lid': loanId,
              ':pdate': validated.paymentDate,
            },
          })
        );

        const isDuplicate = existingRepayments.Items?.some(
          (r: any) => Math.abs(r.amount - validated.amount) < 0.01
        );
        if (isDuplicate) {
          throw new ConflictError(
            `A repayment of ₹${validated.amount} on ${validated.paymentDate} for this loan has already been recorded.`
          );
        }

        const repaymentId = `rep_${Date.now()}_${uuidv4().replace(/-/g, '').slice(0, 6)}`;
        const repayment: LoanRepaymentRecord = {
          userId: user.userId,
          repaymentId,
          loanId,
          paymentDate: validated.paymentDate,
          amount: validated.amount,
          amountInPaise: toPaise(validated.amount),
          principalComponent: validated.principalComponent,
          interestComponent: validated.interestComponent,
          status: 'completed',
          sourceTransactionId: validated.sourceTransactionId,
          createdAt: new Date().toISOString(),
        };

        await docClient.send(
          new PutCommand({
            TableName: TABLES.LOAN_REPAYMENTS,
            Item: repayment,
          })
        );

        // If principalComponent is known, safely update outstanding balance;
        // Do NOT subtract entire EMI if component is unknown!
        if (validated.principalComponent && validated.principalComponent > 0) {
          const newOutstanding = Math.max(0, loan.outstanding - validated.principalComponent);
          await docClient.send(
            new PutCommand({
              TableName: TABLES.LOANS,
              Item: {
                ...loan,
                outstanding: newOutstanding,
                outstandingInPaise: toPaise(newOutstanding),
                remainingMonths: Math.max(0, loan.remainingMonths - 1),
                updatedAt: new Date().toISOString(),
              },
            })
          );
        }

        return successResponse(repayment, 201);
      }
    }

    // Standard Loan CRUD: /loans and /loans/{loanId}
    if (method === 'GET') {
      if (loanId) {
        const result = await docClient.send(
          new GetCommand({
            TableName: TABLES.LOANS,
            Key: { userId: user.userId, loanId },
          })
        );
        if (!result.Item) throw new NotFoundError(`Loan ${loanId} not found`);
        return successResponse(result.Item);
      }

      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLES.LOANS,
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': user.userId },
        })
      );
      return successResponse(result.Items || []);
    }

    if (method === 'POST') {
      const rawBody = parseJsonBody<unknown>(event.body);
      const validated = CreateLoanSchema.parse(rawBody);

      const newLoan: LoanRecord = {
        userId: user.userId,
        loanId: `ln_${Date.now()}_${uuidv4().replace(/-/g, '').slice(0, 6)}`,
        name: validated.name,
        lender: validated.lender,
        type: validated.type,
        principal: validated.principal,
        principalInPaise: toPaise(validated.principal),
        outstanding: validated.outstanding,
        outstandingInPaise: toPaise(validated.outstanding),
        interestRate: validated.interestRate,
        monthlyEMI: validated.monthlyEMI,
        monthlyEMIInPaise: toPaise(validated.monthlyEMI),
        tenureMonths: validated.tenureMonths,
        remainingMonths: validated.remainingMonths,
        nextDueDate: validated.nextDueDate,
        accountId: validated.accountId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLES.LOANS,
          Item: newLoan,
        })
      );

      return successResponse(newLoan, 201);
    }

    if (method === 'PUT') {
      if (!loanId) throw new NotFoundError('Loan ID is required in path');

      const existing = await docClient.send(
        new GetCommand({
          TableName: TABLES.LOANS,
          Key: { userId: user.userId, loanId },
        })
      );
      if (!existing.Item) throw new NotFoundError(`Loan ${loanId} not found`);

      const rawBody = parseJsonBody<unknown>(event.body);
      const validated = UpdateLoanSchema.parse(rawBody);

      const current = existing.Item as LoanRecord;
      const principal = validated.principal !== undefined ? validated.principal : current.principal;
      const outstanding = validated.outstanding !== undefined ? validated.outstanding : current.outstanding;
      const monthlyEMI = validated.monthlyEMI !== undefined ? validated.monthlyEMI : current.monthlyEMI;

      const updatedLoan: LoanRecord = {
        ...current,
        ...validated,
        userId: user.userId,
        loanId,
        principal,
        principalInPaise: toPaise(principal),
        outstanding,
        outstandingInPaise: toPaise(outstanding),
        monthlyEMI,
        monthlyEMIInPaise: toPaise(monthlyEMI),
        updatedAt: new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLES.LOANS,
          Item: updatedLoan,
        })
      );

      return successResponse(updatedLoan);
    }

    if (method === 'DELETE') {
      if (!loanId) throw new NotFoundError('Loan ID is required in path');

      const existing = await docClient.send(
        new GetCommand({
          TableName: TABLES.LOANS,
          Key: { userId: user.userId, loanId },
        })
      );
      if (!existing.Item) throw new NotFoundError(`Loan ${loanId} not found`);

      await docClient.send(
        new DeleteCommand({
          TableName: TABLES.LOANS,
          Key: { userId: user.userId, loanId },
        })
      );

      return successResponse({ success: true, deletedLoanId: loanId });
    }

    return errorResponse(new Error(`Method ${method} not allowed`));
  } catch (err) {
    return errorResponse(err);
  }
}
