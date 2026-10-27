import { describe, it, expect } from 'vitest';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { getAuthenticatedUser } from '../src/shared/auth/index.js';
import { UnauthorizedError } from '../src/shared/errors/index.js';

describe('Security & Multi-Tenant Isolation Tests', () => {
  it('extracts verified identity strictly from Cognito JWT claims sub', () => {
    const event = {
      headers: {},
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: 'cognito-sub-uuid-12345',
              email: 'verified.user@spendwise.app',
              name: 'Verified User',
            },
          },
        },
      },
    } as unknown as APIGatewayProxyEventV2;

    const user = getAuthenticatedUser(event);
    expect(user.userId).toBe('cognito-sub-uuid-12345');
    expect(user.email).toBe('verified.user@spendwise.app');
  });

  it('rejects requests with missing or empty authentication tokens in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    delete process.env.STAGE;
    delete process.env.ENABLE_DEV_AUTH;

    const event = {
      headers: {},
      requestContext: {},
    } as unknown as APIGatewayProxyEventV2;

    expect(() => getAuthenticatedUser(event)).toThrow(UnauthorizedError);

    process.env.NODE_ENV = originalEnv;
  });

  it('never trusts client-supplied query or body parameters for userId', () => {
    // Malicious attacker attempts to supply another user's ID
    const attackerEvent = {
      headers: {},
      queryStringParameters: {
        userId: 'victim-user-999',
      },
      body: JSON.stringify({ userId: 'victim-user-999', title: 'Malicious Edit' }),
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: 'actual-attacker-sub-007',
            },
          },
        },
      },
    } as unknown as APIGatewayProxyEventV2;

    const authenticatedUser = getAuthenticatedUser(attackerEvent);
    // Verified user must strictly match the token subject, not the query/body!
    expect(authenticatedUser.userId).toBe('actual-attacker-sub-007');
    expect(authenticatedUser.userId).not.toBe('victim-user-999');
  });
});
