# SpendWise — AWS Serverless Backend & Database

Production-grade AWS serverless backend and Amazon DynamoDB database architecture for **SpendWise — Smart Personal Finance Management System**.

---

## 1. Architecture Overview

SpendWise backend follows an event-driven, zero-server architecture deployed completely on AWS managed services:

```
+-------------------------------------------------------------------------+
|                    SpendWise Frontend (React 19 / Vite)                 |
+-------------------------------------------------------------------------+
                                    |
                  JWT Bearer Token  |  HTTP Requests
                                    v
+-------------------------------------------------------------------------+
|                  Amazon API Gateway HTTP API ($default)                 |
|       - Native Cognito User Pool JWT Authorizer (Verified Claims)       |
|       - CORS Configuration & Rate Limiting                              |
+-------------------------------------------------------------------------+
                                    |
              Routed to dedicated least-privilege Lambdas
                                    |
         +--------------------------+--------------------------+
         |                          |                          |
         v                          v                          v
+------------------+       +------------------+       +------------------+
| Profile, Accounts|       | Transactions &   |       | Dashboard, Budgets|
| & Rules Lambdas  |       | Categorisation   |       | & Analytics      |
+------------------+       +------------------+       +------------------+
         |                          |                          |
         +--------------------------+--------------------------+
                                    |
                     +--------------+--------------+
                     |                             |
                     v                             v
+------------------------------------+   +------------------------------------+
|          Amazon DynamoDB           |   |              Amazon S3             |
|   - spendwise-users                |   |   - Private Encrypted Storage      |
|   - spendwise-transactions         |   |   - Statement CSV retention        |
|   - spendwise-accounts             |   |   - Encrypted receipt images       |
|   - spendwise-budgets              |   |   - Short-lived presigned URLs     |
|   - spendwise-investments          |   |   - Block Public Access enabled    |
|   - spendwise-loans                |   +------------------------------------+
|   - spendwise-loan-repayments      |
|   - spendwise-import-batches       |
|   - spendwise-transaction-rules    |
|   - spendwise-file-metadata        |
+------------------------------------+
```

---

## 2. Technology Stack

- **Runtime**: Node.js 20.x / 22.x LTS on AWS Lambda (`arm64` Graviton architecture)
- **Language**: TypeScript 5.8 with NodeNext module resolution
- **AWS SDK**: AWS SDK for JavaScript v3 (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
- **Validation**: Zod 3.24 for runtime schema enforcement and input sanitization
- **Testing**: Vitest 3.0 with unit tests and realistic accounting fixtures
- **Infrastructure as Code**: AWS Serverless Application Model (SAM) (`template.yaml`)

---

## 3. Database Schema & Access Patterns (Amazon DynamoDB)

All tables use **On-Demand Capacity Mode (`PAY_PER_REQUEST`)** for optimal cost-efficiency and automatic scaling.

### 3.1 Partition Key Multi-Tenant Isolation
Every application table uses `userId` (Cognito `sub`) as the primary partition key (`HASH`), ensuring strict multi-tenant isolation and mathematical prevention of cross-user data exposure.

| Table Name | Partition Key | Sort Key | Secondary Indexes (GSIs) | Access Patterns |
|---|---|---|---|---|
| `spendwise-users` | `userId` (S) | — | — | Get user profile, update preferences |
| `spendwise-transactions` | `userId` (S) | `transactionId` (S) | `userId-date-index`<br>`userId-fingerprint-index`<br>`userId-category-date-index` | Query by date range, query by category, duplicate detection lookup |
| `spendwise-accounts` | `userId` (S) | `accountId` (S) | — | List accounts, create/edit accounts |
| `spendwise-budgets` | `userId` (S) | `budgetId` (S) | — | List monthly budgets, calculate spent |
| `spendwise-investments` | `userId` (S) | `investmentId` (S) | — | Track mutual funds, SGBs, EPF, stocks |
| `spendwise-loans` | `userId` (S) | `loanId` (S) | — | Track principal, interest, EMI schedules |
| `spendwise-loan-repayments` | `userId` (S) | `repaymentId` (S) | `loanId-paymentDate-index` | Query repayment history per loan |
| `spendwise-import-batches` | `userId` (S) | `importBatchId` (S) | — | Track statement imports & processing |
| `spendwise-transaction-rules` | `userId` (S) | `ruleId` (S) | — | User custom merchant categorization rules |
| `spendwise-file-metadata` | `userId` (S) | `fileId` (S) | — | Manage private S3 file pointers |

### 3.2 Money Representation & Precision
- Monetary amounts are stored internally as **integer paise** (`amountInPaise = Math.round(rupees * 100)`).
- Floating-point arithmetic errors are completely avoided.
- The API response layer serializes clean Rupee numbers for existing frontend compatibility.

---

## 4. Smart Categorisation Engine

SpendWise includes an explainable rule engine in `backend/src/shared/categorisation/`:
- **User Custom Rules**: Highest priority (evaluated first).
- **Curated Indian Merchant Rules**: Swiggy, Zomato, Chai Point, Blinkit, Zepto, Uber, Ola, BESCOM, Airtel, Amazon, Flipkart, Parag Parikh, UTI Mutual Fund, SBI, HDFC, ICICI, etc.
- **Directional Logic**: Credits mapped to Salary/Freelance/Refund; Debits mapped to Expenses/Investments/EMIs/Transfers.
- **Explainability**: Every categorization returns a `confidence` score (0.0 to 1.0) and a human-readable `reason`.
- **Review Needed Flags**: Ambiguous transactions (ATM cash withdrawals, brokerage top-ups, confidence < 0.7) are automatically marked `needsReview = true`.

---

## 5. Authoritative Financial Calculations

Financial metrics are derived by the backend from stored records:
1. **Ordinary Consumption Expenses**: Sums eligible completed debits (`Food`, `Shopping`, `Travel`, `Bills`, `Education`, `Healthcare`, `Entertainment`, `Other`).
2. **Exclusions**:
   - Internal transfers between user's own accounts are excluded from both income and expenses.
   - Investment SIP contributions and Loan principal payments are excluded from ordinary consumption.
3. **Refunds**: Offset respective expense categories without artificially inflating income.
4. **Savings Rate Formula**:
   $$\text{Savings Rate} = \frac{\text{Total Income} - \text{Eligible Consumption Expenses}}{\text{Total Income}} \times 100$$
5. **Loans & Repayments**: Outstanding balance is only reduced by the principal component when known.

---

## 6. S3 File Upload & Download Workflow

1. Client requests upload URL via `POST /uploads/presigned-url` with file metadata (size limited to 15MB).
2. Backend validates user identity and generates a short-lived (15 min) S3 presigned PUT URL.
3. Object key is strictly user-scoped: `users/${userId}/${fileType}s/${fileId}/${uuid}.${ext}`.
4. Client uploads directly to S3 via PUT request.
5. Client downloads file via `GET /uploads/{fileId}/download-url` after ownership verification.
6. Public access is 100% blocked at the bucket level.

---

## 7. API Endpoints Reference

All routes are secured by Cognito JWT authorization (Bearer token required).

### User Profile
- `GET /profile` — Retrieve authenticated user profile
- `PUT /profile` — Update permitted profile fields

### Accounts
- `GET /accounts` — List user financial accounts
- `POST /accounts` — Create an account
- `GET /accounts/{accountId}` — Retrieve single account
- `PUT /accounts/{accountId}` — Update account
- `DELETE /accounts/{accountId}` — Delete account

### Transactions
- `GET /transactions` — List transactions (supports `startDate`, `endDate`, `category`, `type`, `limit`, `nextToken`)
- `POST /transactions` — Create transaction (auto-categorised & fingerprinted)
- `GET /transactions/{transactionId}` — Retrieve single transaction
- `PUT /transactions/{transactionId}` — Update transaction
- `DELETE /transactions/{transactionId}` — Delete transaction
- `POST /transactions/batch` — Batch write transactions (handles chunking, retries, and deduplication)

### Categorisation & Rules
- `POST /transactions/analyse` — Run smart categorization engine on draft
- `POST /transactions/{transactionId}/categorise` — Approve category & optional custom merchant rule
- `GET /transaction-rules` — List custom merchant rules
- `POST /transaction-rules` — Create custom merchant rule
- `PUT /transaction-rules/{ruleId}` — Update rule
- `DELETE /transaction-rules/{ruleId}` — Delete rule

### Budgets
- `GET /budgets` — List user budgets
- `POST /budgets` — Create budget
- `PUT /budgets/{budgetId}` — Update budget
- `DELETE /budgets/{budgetId}` — Delete budget
- `GET /budgets/summary` — Period budget report with dynamic actual spent calculation

### Investments
- `GET /investments` — List investment records
- `POST /investments` — Create investment
- `GET /investments/{investmentId}` — Retrieve investment
- `PUT /investments/{investmentId}` — Update investment
- `DELETE /investments/{investmentId}` — Delete investment

### Loans & Repayments
- `GET /loans` — List active loans and debts
- `POST /loans` — Create loan record
- `GET /loans/{loanId}` — Retrieve loan details
- `PUT /loans/{loanId}` — Update loan
- `DELETE /loans/{loanId}` — Delete loan
- `GET /loans/{loanId}/repayments` — View repayment history
- `POST /loans/{loanId}/repayments` — Record loan repayment (with duplicate check)

### Dashboard & Analytics
- `GET /dashboard/summary` — Authoritative financial metrics & savings rate
- `GET /analytics/cashflow` — Monthly and weekly cashflows
- `GET /analytics/categories` — Consumption spending breakdown
- `GET /analytics/payment-sources` — Spending by payment channel
- `GET /analytics/investments` — Portfolio asset allocation
- `GET /analytics/debt` — Debt breakdown and progress
- `GET /insights` — Rule-based proactive financial insights

### Statement Imports & Receipts
- `POST /imports` — Create import batch and get upload URL
- `GET /imports/{importBatchId}` — Check import status
- `GET /imports/{importBatchId}/errors` — Retrieve import errors
- `POST /imports/{importBatchId}/confirm` — Commit accepted transactions to database
- `DELETE /imports/{importBatchId}` — Cancel uncommitted import batch
- `POST /uploads/presigned-url` — Generate S3 presigned upload URL
- `GET /uploads/{fileId}/download-url` — Generate S3 presigned download URL
- `DELETE /uploads/{fileId}` — Delete file and metadata

---

## 8. Local Development & Testing Instructions

### Prerequisites
- Node.js 20+ LTS
- Windows PowerShell / Bash
- AWS SAM CLI (optional for deployment: `winget install Amazon.SAM-CLI` or `choco install aws-sam-cli`)

### Installation
Run in Windows PowerShell:
```powershell
cd backend
npm install
```

### Type Checking & Build
```powershell
# Type check TypeScript codebase
npm run typecheck

# Compile TypeScript to dist/
npm run build
```

### Automated Tests (Vitest)
```powershell
# Execute complete unit test suite
npm test
```
All 35 tests verify:
- Financial calculation rules (savings rate, paise conversion, refund offsets)
- Smart categorisation engine (merchants, review flags, user rule priority)
- Deduplication fingerprinting
- Security and zero-trust user scoping
- Batch transaction validation

---

## 9. AWS SAM Deployment Instructions

### Step 1: Configure AWS Credentials
Ensure your AWS CLI credentials are configured:
```powershell
aws configure
```

### Step 2: Build with AWS SAM
```powershell
cd backend
sam build
```

### Step 3: Deploy Guided
```powershell
sam deploy --guided
```
Prompt responses:
- **Stack Name**: `spendwise-backend-dev`
- **AWS Region**: `ap-south-1` (or your preferred region)
- **Parameter Stage**: `dev`
- **Parameter CorsAllowedOrigin**: `*` (or your frontend domain)
- **Confirm changes before deploy**: `Y`
- **Allow SAM CLI IAM role creation**: `Y`
- **Disable rollback**: `N`
- **Save arguments to configuration file**: `Y`

### Step 4: Capture Stack Outputs
Upon successful deployment, SAM outputs:
- `HttpApiEndpoint`: e.g. `https://xxxxxx.execute-api.ap-south-1.amazonaws.com/dev`
- `CognitoUserPoolId`: e.g. `ap-south-1_xxxxxx`
- `CognitoUserPoolClientId`: e.g. `xxxxxxxxxxxxxx`
- `StorageBucketName`: e.g. `spendwise-storage-123456789012-ap-south-1-dev`

---

## 10. Connecting the Frontend

1. Open `frontend/.env` (or copy from `frontend/.env.example`).
2. Populate the outputs from your SAM deployment:
```env
VITE_API_BASE_URL="https://xxxxxx.execute-api.ap-south-1.amazonaws.com/dev"
VITE_COGNITO_USER_POOL_ID="ap-south-1_xxxxxx"
VITE_COGNITO_CLIENT_ID="xxxxxxxxxxxxxx"
VITE_AWS_REGION="ap-south-1"
```
3. Start frontend:
```powershell
cd frontend
npm run dev
```
The frontend automatically detects `VITE_API_BASE_URL` and switches to production backend mode!

---

## 11. Cost Considerations & Cleanup

### AWS Free Tier & Pay-Per-Request
- **API Gateway HTTP API**: 1 Million free requests/month for 12 months, then $1.00 per million.
- **AWS Lambda**: 1 Million free requests/month and 3.2M seconds of compute time perpetually free.
- **DynamoDB**: 25 GB free storage and 25 WCU / 25 RCU perpetually free.
- **Amazon S3**: 5 GB standard storage free for 12 months.
- **Amazon Cognito**: 50,000 monthly active users (MAUs) free perpetually.

### Deleting Test Infrastructure
To avoid charges, clean up all provisioned AWS resources at any time with:
```powershell
sam delete --stack-name spendwise-backend-dev --region ap-south-1
```
