# SpendWise — Smart Personal Finance Management System

SpendWise is a production-grade personal financial management system designed for the modern Indian fintech ecosystem, featuring UPI intelligence, micro-spends radar, smart merchant categorization, loan/debt tracking, investment portfolio analytics, and automated bank statement processing.

The repository is structured as a complete full-stack monorepo:

```
speedwise/
|-- backend/       # AWS Serverless Backend (Node.js, TypeScript, DynamoDB, S3, SAM)
|-- frontend/      # React 19 / TypeScript / Vite / TailwindCSS Application
|-- README.md      # Root documentation
```

---

## Architecture Summary

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS v4, Lucide Icons, Recharts, Motion.
- **Backend API**: Amazon API Gateway HTTP API ($default) with Amazon Cognito JWT Authorizer.
- **Compute**: AWS Lambda (Node.js LTS, arm64 Graviton) running TypeScript handlers.
- **Database**: Amazon DynamoDB with 10 dedicated application tables and Global Secondary Indexes (GSIs).
- **File Storage**: Private Amazon S3 bucket with server-side encryption, Block Public Access, and presigned URLs.
- **Infrastructure as Code**: AWS Serverless Application Model (SAM).

---

## Quick Start

### 1. Frontend (Development Mode)
The frontend comes preloaded with sample data for local exploration without requiring immediate AWS cloud infrastructure:

```powershell
cd frontend
npm install --legacy-peer-deps
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Backend (Typecheck, Build & Unit Tests)
```powershell
cd backend
npm install
npm run typecheck
npm test
npm run build
```

### 3. Deploying Backend to AWS
Refer to [`backend/README.md`](file:///c:/Users/yashs/OneDrive/Desktop/speedwise/backend/README.md) for complete AWS SAM deployment instructions:
```powershell
cd backend
sam build
sam deploy --guided
```

Once deployed, copy the `HttpApiEndpoint` and Cognito IDs to `frontend/.env`:
```env
VITE_API_BASE_URL="https://xxxxxx.execute-api.ap-south-1.amazonaws.com/dev"
VITE_COGNITO_USER_POOL_ID="ap-south-1_xxxxxx"
VITE_COGNITO_CLIENT_ID="xxxxxxxxxxxxxx"
VITE_AWS_REGION="ap-south-1"
```
The frontend will automatically switch from local sample data to live AWS DynamoDB persistence.

---

## Directory Structure

```
speedwise/
|-- backend/
|   |-- src/
|   |   |-- functions/           # Dedicated Lambda handlers
|   |   |   |-- accounts/        # Financial accounts & UPI sources
|   |   |   |-- analytics/       # Cashflow, category, & asset analytics
|   |   |   |-- budgets/         # Monthly budgets & dynamic spent calculation
|   |   |   |-- categorisation/  # Smart transaction classifier & rules
|   |   |   |-- dashboard/       # Authoritative financial summary metrics
|   |   |   |-- imports/         # Statement batches & confirmation
|   |   |   |-- insights/        # Dynamic rule-based insights
|   |   |   |-- investments/     # Mutual funds, stocks, SIPs, SGBs, PPF
|   |   |   |-- loans/           # Principal, interest, EMI schedules & repayments
|   |   |   |-- profile/         # User profile & savings preferences
|   |   |   |-- transactions/    # Ledger CRUD, filtering & batch writes
|   |   |   |-- uploads/         # S3 presigned URL generation & metadata
|   |   |
|   |   |-- shared/              # Reusable core modules
|   |   |   |-- auth/            # Cognito JWT claim verification & user scoping
|   |   |   |-- categorisation/  # Explainable Indian merchant rule engine
|   |   |   |-- db/              # DynamoDB DocumentClient & S3 client
|   |   |   |-- errors/          # Structured domain error hierarchy
|   |   |   |-- financial/       # Paise precision, savings rate & fingerprints
|   |   |   |-- http/            # API Gateway responses, headers & parser
|   |   |   |-- validation/      # Zod validation schemas
|   |   |
|   |   |-- types/               # TypeScript domain models & DTOs
|   |
|   |-- tests/                   # Vitest unit & integration test suites
|   |-- template.yaml            # AWS SAM Infrastructure as Code
|   |-- openapi.yaml             # OpenAPI 3.0 API Specification
|   |-- package.json
|   |-- tsconfig.json
|   |-- samconfig.toml.example
|   |-- .env.example
|   |-- README.md
|
|-- frontend/
|   |-- src/
|   |   |-- components/          # React components
|   |   |-- context/             # FinanceContext with dual-mode data service
|   |   |-- data/                # Initial sample datasets
|   |   |-- services/            # Typed API client layer
|   |   |-- types/               # Frontend TypeScript definitions
|   |   |-- utils/               # Currency & date formatters
|   |
|   |-- package.json
|   |-- vite.config.ts
|   |-- .env.example
|
|-- README.md
```
