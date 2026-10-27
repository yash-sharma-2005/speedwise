import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-south-1';

// Create base DynamoDB client
const rawDdbClient = new DynamoDBClient({
  region,
  ...(process.env.DYNAMODB_ENDPOINT ? { endpoint: process.env.DYNAMODB_ENDPOINT } : {}),
});

// Create DynamoDB Document Client with automatic unmarshalling
export const docClient = DynamoDBDocumentClient.from(rawDdbClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// S3 Client
export const s3Client = new S3Client({
  region,
  ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true } : {}),
});

// Configured Table Names
export const TABLES = {
  USERS: process.env.USERS_TABLE || 'spendwise-users',
  TRANSACTIONS: process.env.TRANSACTIONS_TABLE || 'spendwise-transactions',
  ACCOUNTS: process.env.ACCOUNTS_TABLE || 'spendwise-accounts',
  BUDGETS: process.env.BUDGETS_TABLE || 'spendwise-budgets',
  INVESTMENTS: process.env.INVESTMENTS_TABLE || 'spendwise-investments',
  LOANS: process.env.LOANS_TABLE || 'spendwise-loans',
  LOAN_REPAYMENTS: process.env.LOAN_REPAYMENTS_TABLE || 'spendwise-loan-repayments',
  IMPORT_BATCHES: process.env.IMPORT_BATCHES_TABLE || 'spendwise-import-batches',
  TRANSACTION_RULES: process.env.TRANSACTION_RULES_TABLE || 'spendwise-transaction-rules',
  FILE_METADATA: process.env.FILE_METADATA_TABLE || 'spendwise-file-metadata',
};

export const S3_BUCKET = process.env.STORAGE_BUCKET_NAME || 'spendwise-storage';

// Pagination helper: Base64 encode/decode for DynamoDB ExclusiveStartKey
export function encodeNextToken(key: Record<string, unknown> | undefined): string | undefined {
  if (!key) return undefined;
  try {
    return Buffer.from(JSON.stringify(key), 'utf-8').toString('base64');
  } catch {
    return undefined;
  }
}

export function decodeNextToken(token: string | undefined): Record<string, unknown> | undefined {
  if (!token) return undefined;
  try {
    const jsonStr = Buffer.from(token, 'base64').toString('utf-8');
    return JSON.parse(jsonStr);
  } catch {
    return undefined;
  }
}
