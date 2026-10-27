export type TransactionType = 'debit' | 'credit';

export type FinancialClassification =
  | 'expense'
  | 'income'
  | 'investment_contribution'
  | 'loan_repayment'
  | 'transfer'
  | 'refund'
  | 'unknown';

export type TransactionCategory =
  | 'Salary'
  | 'Freelance'
  | 'Shopping'
  | 'Food'
  | 'Travel'
  | 'Bills'
  | 'Education'
  | 'Healthcare'
  | 'Entertainment'
  | 'Investment'
  | 'Debt EMI'
  | 'Other';

export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface TransactionRecord {
  userId: string;
  transactionId: string;
  title: string;
  merchant: string;
  category: TransactionCategory;
  amount: number; // In Rupees for compatibility
  amountInPaise: number; // Integer precision
  type: TransactionType;
  transactionType: FinancialClassification;
  date: string; // YYYY-MM-DD
  source: string;
  accountId?: string;
  paymentMethod?: string;
  status: TransactionStatus;
  upiRef?: string;
  notes?: string;
  isRecurring?: boolean;
  importBatchId?: string;
  sourceFileId?: string;
  fingerprint: string;
  classificationConfidence?: number;
  classificationReason?: string;
  needsReview?: boolean;
  isDuplicate?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AccountType =
  | 'Bank account'
  | 'UPI source'
  | 'Credit card'
  | 'Debit card'
  | 'Investment account'
  | 'Loan account'
  | 'Cash'
  | 'Other';

export type AccountSourceType =
  | 'Manually entered'
  | 'Imported file'
  | 'Sample data'
  | 'Authorised integration';

export interface AccountRecord {
  userId: string;
  accountId: string;
  displayName: string;
  accountType: AccountType;
  providerName: string;
  sourceType: AccountSourceType;
  currency: string;
  maskedIdentifier?: string;
  openingBalance?: number;
  openingBalanceInPaise?: number;
  status: 'active' | 'archived' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface BudgetRecord {
  userId: string;
  budgetId: string;
  category: TransactionCategory;
  monthlyLimit: number;
  monthlyLimitInPaise: number;
  spent: number;
  period: string; // e.g. "October 2026"
  createdAt: string;
  updatedAt: string;
}

export type InvestmentType =
  | 'Mutual Fund'
  | 'Stocks'
  | 'EPF / PPF'
  | 'Gold / SGB'
  | 'Fixed Deposit'
  | 'Crypto';

export interface InvestmentRecord {
  userId: string;
  investmentId: string;
  name: string;
  type: InvestmentType;
  platform?: string;
  accountId?: string;
  investedAmount: number;
  investedAmountInPaise: number;
  currentValue: number;
  currentValueInPaise: number;
  returns: number;
  returnPercentage: number;
  monthlySIP?: number;
  nextDebitDate?: string;
  allocationPercentage: number;
  valuationDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type LoanType =
  | 'Education Loan'
  | 'Car Loan'
  | 'Home Loan'
  | 'Personal Loan'
  | 'Credit Card EMI';

export interface LoanRecord {
  userId: string;
  loanId: string;
  name: string;
  lender: string;
  type: LoanType;
  principal: number;
  principalInPaise: number;
  outstanding: number;
  outstandingInPaise: number;
  interestRate: number;
  monthlyEMI: number;
  monthlyEMIInPaise: number;
  tenureMonths: number;
  remainingMonths: number;
  nextDueDate: string; // YYYY-MM-DD
  accountId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanRepaymentRecord {
  userId: string;
  repaymentId: string;
  loanId: string;
  paymentDate: string;
  amount: number;
  amountInPaise: number;
  principalComponent?: number;
  interestComponent?: number;
  status: 'completed' | 'pending' | 'failed';
  sourceTransactionId?: string;
  createdAt: string;
}

export type ImportBatchStatus =
  | 'pending'
  | 'processing'
  | 'needs_review'
  | 'completed'
  | 'completed_with_errors'
  | 'failed'
  | 'cancelled';

export interface ImportBatchRecord {
  userId: string;
  importBatchId: string;
  fileName: string;
  fileType: string;
  source: string;
  status: ImportBatchStatus;
  totalRecords: number;
  acceptedRecords: number;
  rejectedRecords: number;
  duplicateRecords: number;
  reviewRequiredRecords: number;
  errorSummary?: string[];
  createdAt: string;
  completedAt?: string;
}

export interface TransactionRuleRecord {
  userId: string;
  ruleId: string;
  merchantPattern: string;
  category: TransactionCategory;
  transactionType: FinancialClassification;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface FileMetadataRecord {
  userId: string;
  fileId: string;
  fileType: 'statement' | 'receipt' | 'report';
  originalFileName: string;
  s3ObjectKey: string;
  associatedTransactionId?: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}

export interface UserProfileRecord {
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  location: string;
  currency: 'INR' | 'USD' | 'EUR';
  salaryPayDate: number;
  monthlySavingsTarget: number;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialInsight {
  id: string;
  type: 'warning' | 'positive' | 'info' | 'action';
  title: string;
  description: string;
  metric?: string;
  targetSection: 'transactions' | 'budgets' | 'investments' | 'loans';
}

export interface DashboardSummaryResponse {
  totalIncome: number;
  totalExpenses: number;
  totalInvestments: number;
  outstandingDebt: number;
  availableBalance: number;
  monthlySavingsRate: number;
  investmentContributions: number;
  loanRepayments: number;
}

export interface CashFlowMonth {
  month: string;
  income: number;
  expenses: number;
  investments: number;
  loanRepayments: number;
}

export interface CashFlowWeek {
  week: string;
  income: number;
  expenses: number;
  investments: number;
  loanRepayments: number;
}

export interface PaginatedResult<T> {
  items: T[];
  nextToken?: string;
  totalCount?: number;
}
