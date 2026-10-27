import { describe, it, expect } from 'vitest';
import {
  CreateTransactionSchema,
  BatchTransactionsSchema,
  CreateBudgetSchema,
  CreateInvestmentSchema,
  CreateLoanSchema,
} from '../src/shared/validation/index.js';

describe('Transaction & Entity Schema Validations', () => {
  describe('CreateTransactionSchema', () => {
    it('accepts a valid transaction payload', () => {
      const validTx = {
        title: 'Swiggy Dinner Order',
        merchant: 'Swiggy',
        category: 'Food',
        amount: 850,
        type: 'debit',
        date: '2026-10-27',
        source: 'UPI - Google Pay',
        status: 'completed',
        upiRef: 'UPI-261027-1092',
      };
      const result = CreateTransactionSchema.safeParse(validTx);
      expect(result.success).toBe(true);
    });

    it('rejects negative or zero amounts', () => {
      const negativeTx = {
        title: 'Invalid Negative',
        merchant: 'Merchant',
        category: 'Food',
        amount: -500,
        type: 'debit',
        date: '2026-10-27',
        source: 'UPI',
      };
      const result = CreateTransactionSchema.safeParse(negativeTx);
      expect(result.success).toBe(false);

      const zeroTx = {
        ...negativeTx,
        amount: 0,
      };
      expect(CreateTransactionSchema.safeParse(zeroTx).success).toBe(false);
    });

    it('rejects invalid date format', () => {
      const invalidDateTx = {
        title: 'Invalid Date',
        merchant: 'Merchant',
        category: 'Food',
        amount: 250,
        type: 'debit',
        date: '27-10-2026', // Should be YYYY-MM-DD
        source: 'UPI',
      };
      const result = CreateTransactionSchema.safeParse(invalidDateTx);
      expect(result.success).toBe(false);
    });

    it('rejects invalid transaction category', () => {
      const invalidCatTx = {
        title: 'Invalid Category',
        merchant: 'Merchant',
        category: 'InvalidCategory123',
        amount: 250,
        type: 'debit',
        date: '2026-10-27',
        source: 'UPI',
      };
      const result = CreateTransactionSchema.safeParse(invalidCatTx);
      expect(result.success).toBe(false);
    });
  });

  describe('BatchTransactionsSchema', () => {
    it('accepts a valid array of transactions', () => {
      const batch = {
        transactions: [
          {
            title: 'Tx 1',
            merchant: 'M1',
            category: 'Food',
            amount: 100,
            type: 'debit',
            date: '2026-10-01',
            source: 'UPI',
          },
          {
            title: 'Tx 2',
            merchant: 'M2',
            category: 'Shopping',
            amount: 500,
            type: 'debit',
            date: '2026-10-02',
            source: 'Card',
          },
        ],
      };
      expect(BatchTransactionsSchema.safeParse(batch).success).toBe(true);
    });

    it('rejects empty transaction batch', () => {
      expect(BatchTransactionsSchema.safeParse({ transactions: [] }).success).toBe(false);
    });
  });

  describe('Budget & Investment Schemas', () => {
    it('validates budget limits strictly', () => {
      expect(
        CreateBudgetSchema.safeParse({
          category: 'Food',
          monthlyLimit: 8000,
          period: 'October 2026',
        }).success
      ).toBe(true);

      expect(
        CreateBudgetSchema.safeParse({
          category: 'Food',
          monthlyLimit: -100,
          period: 'October 2026',
        }).success
      ).toBe(false);
    });

    it('validates investment returns and allocations', () => {
      expect(
        CreateInvestmentSchema.safeParse({
          name: 'UTI Nifty 50 Index Fund',
          type: 'Mutual Fund',
          investedAmount: 32000,
          currentValue: 36800,
          allocationPercentage: 25.4,
        }).success
      ).toBe(true);

      expect(
        CreateInvestmentSchema.safeParse({
          name: 'Negative Invested',
          type: 'Mutual Fund',
          investedAmount: -5000,
          currentValue: 5000,
        }).success
      ).toBe(false);
    });

    it('validates loan terms and interest rates', () => {
      expect(
        CreateLoanSchema.safeParse({
          name: 'SBI Scholar Loan',
          lender: 'State Bank of India',
          type: 'Education Loan',
          principal: 450000,
          outstanding: 245000,
          interestRate: 8.4,
          monthlyEMI: 8500,
          tenureMonths: 60,
          remainingMonths: 32,
          nextDueDate: '2026-11-10',
        }).success
      ).toBe(true);
    });
  });
});
