import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '../../shared/db/index.js';
import { getAuthenticatedUser } from '../../shared/auth/index.js';
import { successResponse, errorResponse, parseJsonBody } from '../../shared/http/index.js';
import { UpdateProfileSchema } from '../../shared/validation/index.js';
import { UserProfileRecord } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const user = getAuthenticatedUser(event);
    const method = event.requestContext.http.method.toUpperCase();

    if (method === 'GET') {
      const result = await docClient.send(
        new GetCommand({
          TableName: TABLES.USERS,
          Key: { userId: user.userId },
        })
      );

      if (!result.Item) {
        // Return default profile initialized with token identity
        const defaultProfile: UserProfileRecord = {
          userId: user.userId,
          name: user.name || 'SpendWise User',
          email: user.email || 'user@spendwise.app',
          phone: '+91 98765 43210',
          role: 'Senior Software Engineer',
          location: 'Bengaluru, India',
          currency: 'INR',
          salaryPayDate: 1,
          monthlySavingsTarget: 30,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await docClient.send(
          new PutCommand({
            TableName: TABLES.USERS,
            Item: defaultProfile,
          })
        );

        return successResponse(defaultProfile);
      }

      return successResponse(result.Item);
    }

    if (method === 'PUT') {
      const rawBody = parseJsonBody<unknown>(event.body);
      const validated = UpdateProfileSchema.parse(rawBody);

      // Fetch existing
      const existing = await docClient.send(
        new GetCommand({
          TableName: TABLES.USERS,
          Key: { userId: user.userId },
        })
      );

      const currentItem: UserProfileRecord = (existing.Item as UserProfileRecord) || {
        userId: user.userId,
        name: user.name || 'SpendWise User',
        email: user.email || 'user@spendwise.app',
        phone: '+91 98765 43210',
        role: 'Senior Software Engineer',
        location: 'Bengaluru, India',
        currency: 'INR',
        salaryPayDate: 1,
        monthlySavingsTarget: 30,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedProfile: UserProfileRecord = {
        ...currentItem,
        ...validated,
        // Crucial security constraint: user identity fields cannot be overridden by client
        userId: user.userId,
        email: currentItem.email || user.email || 'user@spendwise.app',
        updatedAt: new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLES.USERS,
          Item: updatedProfile,
        })
      );

      return successResponse(updatedProfile);
    }

    return errorResponse(new Error(`Method ${method} not allowed`));
  } catch (err) {
    return errorResponse(err);
  }
}
