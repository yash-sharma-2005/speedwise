import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { UnauthorizedError } from '../errors/index.js';

export interface AuthenticatedUser {
  userId: string;
  email?: string;
  name?: string;
  claims: Record<string, unknown>;
}

/**
 * Extracts and strictly verifies the authenticated user from API Gateway HTTP API JWT authorizer claims.
 * Never trusts client-supplied query or body parameters for user identity.
 */
export function getAuthenticatedUser(event: APIGatewayProxyEventV2): AuthenticatedUser {
  // 1. Production API Gateway HTTP API with Cognito JWT authorizer
  const authorizerClaims = (event.requestContext as unknown as {
    authorizer?: {
      jwt?: {
        claims?: Record<string, unknown>;
      };
    };
  })?.authorizer?.jwt?.claims;

  if (authorizerClaims && typeof authorizerClaims.sub === 'string' && authorizerClaims.sub.trim().length > 0) {
    return {
      userId: authorizerClaims.sub,
      email: typeof authorizerClaims.email === 'string' ? authorizerClaims.email : undefined,
      name: typeof authorizerClaims.name === 'string' ? authorizerClaims.name : undefined,
      claims: authorizerClaims,
    };
  }

  // 2. Controlled Local / Test Mode Fallback
  // Only allowed if explicitly enabled by environment variable for local testing or mock headers in test suite
  const isDevOrTest = process.env.NODE_ENV === 'test' || process.env.STAGE === 'local' || process.env.ENABLE_DEV_AUTH === 'true';

  if (isDevOrTest) {
    const devUserIdHeader = event.headers?.['x-user-id'] || event.headers?.['X-User-Id'];
    if (devUserIdHeader && typeof devUserIdHeader === 'string' && devUserIdHeader.trim().length > 0) {
      return {
        userId: devUserIdHeader.trim(),
        email: event.headers?.['x-user-email'] || 'dev@spendwise.local',
        name: 'SpendWise Local User',
        claims: { sub: devUserIdHeader.trim(), devMode: true },
      };
    }

    // Default test user when running automated Vitest tests
    if (process.env.NODE_ENV === 'test') {
      return {
        userId: 'test-user-001',
        email: 'test@spendwise.local',
        name: 'Test Runner User',
        claims: { sub: 'test-user-001', test: true },
      };
    }
  }

  // Unauthorized if no verified JWT claims found
  throw new UnauthorizedError(
    'Authentication required: missing or invalid authorization token.'
  );
}
