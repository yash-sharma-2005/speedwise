export type TransactionType = 'debit' | 'credit';

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

export interface Transaction {
  id: string;
  title: string;
  merchant: string;
  category: TransactionCategory;
  amount: number;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  source: string; // e.g. 'HDFC Bank', 'ICICI Bank', 'GPay UPI', 'PhonePe', 'Credit Card'
  status: 'completed' | 'pending' | 'failed';
  upiRef?: string;
  notes?: string;
  isRecurring?: boolean;
}

export interface Budget {
  id: string;
  category: TransactionCategory;
  monthlyLimit: number;
  spent: number;
  period: string; // e.g. "October 2026"
}

export type InvestmentType =
  | 'Mutual Fund'
  | 'Stocks'
  | 'EPF / PPF'
  | 'Gold / SGB'
  | 'Fixed Deposit'
  | 'Crypto';

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  investedAmount: number;
  currentValue: number;
  returns: number;
  returnPercentage: number;
  monthlySIP?: number;
  nextDebitDate?: string;
  allocationPercentage: number;
}

export type LoanType =
  | 'Education Loan'
  | 'Car Loan'
  | 'Home Loan'
  | 'Personal Loan'
  | 'Credit Card EMI';

export interface Loan {
  id: string;
  name: string;
  lender: string;
  type: LoanType;
  principal: number;
  outstanding: number;
  interestRate: number; // in percentage e.g. 8.5
  monthlyEMI: number;
  tenureMonths: number;
  remainingMonths: number;
  nextDueDate: string; // YYYY-MM-DD
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

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  location: string;
  currency: 'INR' | 'USD' | 'EUR';
  salaryPayDate: number; // day of month, e.g. 1
  monthlySavingsTarget: number;
}

export interface FinancialInsight {
  id: string;
  type: 'warning' | 'positive' | 'info' | 'action';
  title: string;
  description: string;
  metric?: string;
  targetSection: 'transactions' | 'budgets' | 'investments' | 'loans';
}
