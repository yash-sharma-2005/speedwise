import { describe, it, expect } from 'vitest';
import {
  toPaise,
  toRupees,
  generateTransactionFingerprint,
  calculateFinancialSummary,
  calculateMonthlyCashflow,
  generateFinancialInsights,
} from '../src/shared/financial/index.js';
import { TransactionRecord, InvestmentRecord, LoanRecord } from '../src/types/index.js';

describe('Financial Calculation Rules & Precision Engine', () => {
  describe('Rupee to Paise Precision & Validation', () => {
    it('converts Rupee values to integer Paise accurately', () => {
      expect(toPaise(85000)).toBe(8500000);
      expect(toPaise(24.5)).toBe(2450);
      expect(toPaise(149.99)).toBe(14999);
      expect(toPaise(0)).toBe(0);
    });

    it('converts Paise to standard Rupees accurately', () => {
      expect(toRupees(8500000)).toBe(85000);
      expect(toRupees(2450)).toBe(24.5);
      expect(toRupees(14999)).toBe(149.99);
    });

    it('rejects invalid or non-numeric monetary inputs', () => {
      expect(() => toPaise(NaN)).toThrow();
      expect(() => toPaise(Infinity)).toThrow();
    });
  });

  describe('Deduplication Fingerprint Generator', () => {
    it('generates deterministic fingerprint for transactions with UPI ref', () => {
      const fp1 = generateTransactionFingerprint({
        date: '2026-10-14',
        amountInPaise: 142000,
        merchant: 'Swiggy',
        upiRef: 'UPI-261014-9921',
      });
      const fp2 = generateTransactionFingerprint({
        date: '2026-10-14',
        amountInPaise: 142000,
        merchant: 'Swiggy India',
        upiRef: 'upi-261014-9921',
      });
      expect(fp1).toBe(fp2);
    });

    it('generates different fingerprints for distinct dates or amounts', () => {
      const fp1 = generateTransactionFingerprint({
        date: '2026-10-14',
        amountInPaise: 142000,
        merchant: 'Swiggy',
      });
      const fp2 = generateTransactionFingerprint({
        date: '2026-10-15',
        amountInPaise: 142000,
        merchant: 'Swiggy',
      });
      const fp3 = generateTransactionFingerprint({
        date: '2026-10-14',
        amountInPaise: 150000,
        merchant: 'Swiggy',
      });
      expect(fp1).not.toBe(fp2);
      expect(fp1).not.toBe(fp3);
    });
  });

  describe('Authoritative Financial Summary & Accounting Rules', () => {
    const mockTransactions: TransactionRecord[] = [
      {
        userId: 'u1',
        transactionId: 't1',
        title: 'Salary',
        merchant: 'TechCorp',
        category: 'Salary',
        amount: 85000,
        amountInPaise: 8500000,
        type: 'credit',
        transactionType: 'income',
        date: '2026-10-01',
        source: 'ICICI Salary',
        status: 'completed',
        fingerprint: 'fp1',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
      {
        userId: 'u1',
        transactionId: 't2',
        title: 'Dining Out',
        merchant: 'Swiggy',
        category: 'Food',
        amount: 5000,
        amountInPaise: 500000,
        type: 'debit',
        transactionType: 'expense',
        date: '2026-10-14',
        source: 'UPI',
        status: 'completed',
        fingerprint: 'fp2',
        createdAt: '2026-10-14T00:00:00Z',
        updatedAt: '2026-10-14T00:00:00Z',
      },
      {
        userId: 'u1',
        transactionId: 't3',
        title: 'Shopping',
        merchant: 'Amazon',
        category: 'Shopping',
        amount: 15000,
        amountInPaise: 1500000,
        type: 'debit',
        transactionType: 'expense',
        date: '2026-10-12',
        source: 'HDFC Card',
        status: 'completed',
        fingerprint: 'fp3',
        createdAt: '2026-10-12T00:00:00Z',
        updatedAt: '2026-10-12T00:00:00Z',
      },
      {
        userId: 'u1',
        transactionId: 't4',
        title: 'SIP Auto Debit',
        merchant: 'Parag Parikh Flexi Cap',
        category: 'Investment',
        amount: 10000,
        amountInPaise: 1000000,
        type: 'debit',
        transactionType: 'investment_contribution',
        date: '2026-10-05',
        source: 'HDFC Bank',
        status: 'completed',
        fingerprint: 'fp4',
        createdAt: '2026-10-05T00:00:00Z',
        updatedAt: '2026-10-05T00:00:00Z',
      },
      {
        userId: 'u1',
        transactionId: 't5',
        title: 'Education Loan EMI',
        merchant: 'SBI',
        category: 'Debt EMI',
        amount: 8500,
        amountInPaise: 850000,
        type: 'debit',
        transactionType: 'loan_repayment',
        date: '2026-10-10',
        source: 'ICICI Bank',
        status: 'completed',
        fingerprint: 'fp5',
        createdAt: '2026-10-10T00:00:00Z',
        updatedAt: '2026-10-10T00:00:00Z',
      },
      {
        userId: 'u1',
        transactionId: 't6',
        title: 'Transfer to ICICI savings',
        merchant: 'Self Transfer',
        category: 'Other',
        amount: 20000,
        amountInPaise: 2000000,
        type: 'debit',
        transactionType: 'transfer',
        date: '2026-10-18',
        source: 'HDFC Bank',
        status: 'completed',
        fingerprint: 'fp6',
        createdAt: '2026-10-18T00:00:00Z',
        updatedAt: '2026-10-18T00:00:00Z',
      },
    ];

    const mockInvestments: InvestmentRecord[] = [
      {
        userId: 'u1',
        investmentId: 'inv1',
        name: 'PPFAS Flexi Cap Fund',
        type: 'Mutual Fund',
        investedAmount: 55000,
        investedAmountInPaise: 5500000,
        currentValue: 65400,
        currentValueInPaise: 6540000,
        returns: 10400,
        returnPercentage: 18.9,
        monthlySIP: 10000,
        allocationPercentage: 100,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
    ];

    const mockLoans: LoanRecord[] = [
      {
        userId: 'u1',
        loanId: 'ln1',
        name: 'SBI Scholar Loan',
        lender: 'State Bank of India',
        type: 'Education Loan',
        principal: 450000,
        principalInPaise: 45000000,
        outstanding: 245000,
        outstandingInPaise: 24500000,
        interestRate: 8.4,
        monthlyEMI: 8500,
        monthlyEMIInPaise: 850000,
        tenureMonths: 60,
        remainingMonths: 32,
        nextDueDate: '2026-11-10',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
    ];

    it('calculates total income excluding internal transfers', () => {
      const summary = calculateFinancialSummary(mockTransactions, mockInvestments, mockLoans);
      expect(summary.totalIncome).toBe(85000);
    });

    it('calculates eligible consumption expenses excluding investments, loan EMIs, and transfers', () => {
      const summary = calculateFinancialSummary(mockTransactions, mockInvestments, mockLoans);
      // Food (5000) + Shopping (15000) = 20000
      expect(summary.totalExpenses).toBe(20000);
      expect(summary.investmentContributions).toBe(10000);
      expect(summary.loanRepayments).toBe(8500);
    });

    it('calculates accurate savings rate as (Income - Consumption Expenses) / Income * 100', () => {
      const summary = calculateFinancialSummary(mockTransactions, mockInvestments, mockLoans);
      // (85000 - 20000) / 85000 * 100 = 76.47% -> 76%
      expect(summary.monthlySavingsRate).toBe(76);
    });

    it('handles refund without inflating income and correctly offsets expenses', () => {
      const txWithRefund: TransactionRecord[] = [
        ...mockTransactions,
        {
          userId: 'u1',
          transactionId: 't7',
          title: 'Amazon Product Refund',
          merchant: 'Amazon India',
          category: 'Shopping',
          amount: 2000,
          amountInPaise: 200000,
          type: 'credit',
          transactionType: 'refund',
          date: '2026-10-15',
          source: 'HDFC Card',
          status: 'completed',
          fingerprint: 'fp7',
          createdAt: '2026-10-15T00:00:00Z',
          updatedAt: '2026-10-15T00:00:00Z',
        },
      ];

      const summary = calculateFinancialSummary(txWithRefund, mockInvestments, mockLoans);
      expect(summary.totalIncome).toBe(85000); // Not inflated!
      expect(summary.totalExpenses).toBe(18000); // 20000 - 2000 = 18000
    });
  });

  describe('Financial Insights Generation', () => {
    it('generates proactive warnings when food or shopping spend is elevated', () => {
      const txs: TransactionRecord[] = [
        {
          userId: 'u1',
          transactionId: 't1',
          title: 'Dining out',
          merchant: 'Swiggy',
          category: 'Food',
          amount: 6000,
          amountInPaise: 600000,
          type: 'debit',
          transactionType: 'expense',
          date: '2026-10-10',
          source: 'UPI',
          status: 'completed',
          fingerprint: 'fp1',
          createdAt: '2026-10-10T00:00:00Z',
          updatedAt: '2026-10-10T00:00:00Z',
        },
      ];
      const insights = generateFinancialInsights(txs, [], []);
      expect(insights.some((i) => i.targetSection === 'budgets')).toBe(true);
    });
  });
});
