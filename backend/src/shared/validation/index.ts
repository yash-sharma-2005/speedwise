import { z } from 'zod';

export const TransactionCategoryEnum = z.enum([
  'Salary',
  'Freelance',
  'Shopping',
  'Food',
  'Travel',
  'Bills',
  'Education',
  'Healthcare',
  'Entertainment',
  'Investment',
  'Debt EMI',
  'Other',
]);

export const TransactionTypeEnum = z.enum(['debit', 'credit']);

export const TransactionStatusEnum = z.enum(['completed', 'pending', 'failed']);

export const FinancialClassificationEnum = z.enum([
  'expense',
  'income',
  'investment_contribution',
  'loan_repayment',
  'transfer',
  'refund',
  'unknown',
]);

// 1. Transactions
export const CreateTransactionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  merchant: z.string().min(1, 'Merchant is required').max(150),
  category: TransactionCategoryEnum,
  amount: z.number().positive('Amount must be positive and non-zero'),
  type: TransactionTypeEnum,
  transactionType: FinancialClassificationEnum.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  source: z.string().min(1, 'Payment source is required').max(100),
  accountId: z.string().optional(),
  paymentMethod: z.string().optional(),
  status: TransactionStatusEnum.default('completed'),
  upiRef: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  isRecurring: z.boolean().optional(),
});

export const UpdateTransactionSchema = CreateTransactionSchema.partial();

export const BatchTransactionsSchema = z.object({
  transactions: z.array(CreateTransactionSchema).min(1, 'At least one transaction required').max(100),
  importBatchId: z.string().optional(),
});

export const AnalyseTransactionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  merchant: z.string().optional(),
  type: TransactionTypeEnum.optional(),
  amount: z.number().positive().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export const CategoriseTransactionSchema = z.object({
  category: TransactionCategoryEnum,
  transactionType: FinancialClassificationEnum.optional(),
  saveMerchantRule: z.boolean().optional(),
});

// 2. Accounts
export const AccountTypeEnum = z.enum([
  'Bank account',
  'UPI source',
  'Credit card',
  'Debit card',
  'Investment account',
  'Loan account',
  'Cash',
  'Other',
]);

export const CreateAccountSchema = z.object({
  displayName: z.string().min(1, 'Account name is required').max(100),
  accountType: AccountTypeEnum,
  providerName: z.string().min(1, 'Provider name is required').max(100),
  sourceType: z.enum(['Manually entered', 'Imported file', 'Sample data', 'Authorised integration']).default('Manually entered'),
  currency: z.string().default('INR'),
  maskedIdentifier: z.string().max(50).optional(),
  openingBalance: z.number().optional().default(0),
  status: z.enum(['active', 'archived', 'closed']).default('active'),
});

export const UpdateAccountSchema = CreateAccountSchema.partial();

// 3. Budgets
export const CreateBudgetSchema = z.object({
  category: TransactionCategoryEnum,
  monthlyLimit: z.number().positive('Monthly limit must be positive'),
  period: z.string().min(1, 'Period is required').max(50), // e.g. "October 2026"
});

export const UpdateBudgetSchema = z.object({
  monthlyLimit: z.number().positive().optional(),
  period: z.string().optional(),
});

// 4. Investments
export const InvestmentTypeEnum = z.enum([
  'Mutual Fund',
  'Stocks',
  'EPF / PPF',
  'Gold / SGB',
  'Fixed Deposit',
  'Crypto',
]);

export const CreateInvestmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  type: InvestmentTypeEnum,
  platform: z.string().max(100).optional(),
  accountId: z.string().optional(),
  investedAmount: z.number().min(0, 'Invested amount cannot be negative'),
  currentValue: z.number().min(0, 'Current value cannot be negative'),
  returns: z.number().optional(),
  returnPercentage: z.number().optional(),
  monthlySIP: z.number().min(0).optional(),
  nextDebitDate: z.string().optional(),
  allocationPercentage: z.number().min(0).max(100).optional().default(0),
  valuationDate: z.string().optional(),
});

export const UpdateInvestmentSchema = CreateInvestmentSchema.partial();

// 5. Loans
export const LoanTypeEnum = z.enum([
  'Education Loan',
  'Car Loan',
  'Home Loan',
  'Personal Loan',
  'Credit Card EMI',
]);

export const CreateLoanSchema = z.object({
  name: z.string().min(1, 'Loan name is required').max(150),
  lender: z.string().min(1, 'Lender is required').max(150),
  type: LoanTypeEnum,
  principal: z.number().positive('Principal must be positive'),
  outstanding: z.number().min(0, 'Outstanding balance cannot be negative'),
  interestRate: z.number().min(0, 'Interest rate cannot be negative').max(100),
  monthlyEMI: z.number().positive('Monthly EMI must be positive'),
  tenureMonths: z.number().int().positive('Tenure must be positive'),
  remainingMonths: z.number().int().min(0, 'Remaining months cannot be negative'),
  nextDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD'),
  accountId: z.string().optional(),
});

export const UpdateLoanSchema = CreateLoanSchema.partial();

export const CreateLoanRepaymentSchema = z.object({
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Payment date must be YYYY-MM-DD'),
  amount: z.number().positive('Repayment amount must be positive'),
  principalComponent: z.number().min(0).optional(),
  interestComponent: z.number().min(0).optional(),
  sourceTransactionId: z.string().optional(),
});

// 6. User Profile
export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(30).optional(),
  role: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  currency: z.enum(['INR', 'USD', 'EUR']).optional(),
  salaryPayDate: z.number().int().min(1).max(31).optional(),
  monthlySavingsTarget: z.number().min(0).max(100).optional(),
});

// 7. Transaction Rules
export const CreateTransactionRuleSchema = z.object({
  merchantPattern: z.string().min(1, 'Pattern is required').max(100),
  category: TransactionCategoryEnum,
  transactionType: FinancialClassificationEnum.default('expense'),
  priority: z.number().int().default(1),
});

export const UpdateTransactionRuleSchema = CreateTransactionRuleSchema.partial();

// 8. Uploads & Imports
export const PresignedUrlRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.enum(['statement', 'receipt', 'report']),
  contentType: z.string().min(1),
  fileSize: z.number().positive().max(15 * 1024 * 1024, 'File size exceeds maximum 15MB limit'),
  associatedTransactionId: z.string().optional(),
});

export const CreateImportBatchSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().default('csv'),
  source: z.string().default('Bank Statement'),
});

export const ConfirmImportBatchSchema = z.object({
  transactions: z.array(CreateTransactionSchema).min(1, 'At least one transaction required'),
});
