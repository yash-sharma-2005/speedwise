import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { AppError } from '../errors/index.js';

export const corsHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': process.env.CORS_ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

export function buildResponse(
  statusCode: number,
  body: unknown,
  extraHeaders: Record<string, string> = {}
): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: {
      ...corsHeaders,
      ...extraHeaders,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}

export function successResponse(
  data: unknown,
  statusCode = 200,
  extraHeaders: Record<string, string> = {}
): APIGatewayProxyStructuredResultV2 {
  return buildResponse(statusCode, data, extraHeaders);
}

export function errorResponse(error: unknown): APIGatewayProxyStructuredResultV2 {
  if (error instanceof AppError) {
    return buildResponse(error.statusCode, {
      success: false,
      error: {
        code: error.name,
        message: error.message,
        details: error.details,
      },
    });
  }

  // Unhandled / system errors: avoid leaking internal stack
  console.error('Unhandled internal server error:', error);
  return buildResponse(500, {
    success: false,
    error: {
      code: 'InternalServerError',
      message: 'An unexpected internal error occurred. Please try again.',
    },
  });
}

export function parseJsonBody<T>(body: string | undefined | null): T {
  if (!body) {
    throw new AppError('Request body cannot be empty', 400);
  }
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new AppError('Invalid JSON payload provided in request body', 400);
  }
}
