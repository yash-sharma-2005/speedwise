import { describe, it, expect } from 'vitest';
import { analyseTransaction } from '../src/shared/categorisation/index.js';
import { TransactionRuleRecord } from '../src/types/index.js';

describe('Smart Transaction Categorisation Engine', () => {
  it('correctly categorises food delivery merchants (Swiggy, Zomato)', () => {
    const swiggyResult = analyseTransaction({
      title: 'Swiggy Gourmet Order',
      merchant: 'Swiggy India',
      type: 'debit',
      amount: 1420,
    });
    expect(swiggyResult.suggestedCategory).toBe('Food');
    expect(swiggyResult.suggestedTransactionType).toBe('expense');
    expect(swiggyResult.confidence).toBeGreaterThanOrEqual(0.9);
    expect(swiggyResult.needsReview).toBe(false);

    const zomatoResult = analyseTransaction({
      title: 'Zomato Biryani Delivery',
      merchant: 'Zomato',
      type: 'debit',
      amount: 680,
    });
    expect(zomatoResult.suggestedCategory).toBe('Food');
    expect(zomatoResult.suggestedTransactionType).toBe('expense');
  });

  it('correctly identifies e-commerce shopping (Amazon, Flipkart)', () => {
    const result = analyseTransaction({
      title: 'Ergonomic Chair Accessories',
      merchant: 'Amazon India',
      type: 'debit',
      amount: 4850,
    });
    expect(result.suggestedCategory).toBe('Shopping');
    expect(result.suggestedTransactionType).toBe('expense');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    expect(result.needsReview).toBe(false);
  });

  it('correctly recognises regular corporate salary as income', () => {
    const result = analyseTransaction({
      title: 'Monthly Salary Credit',
      merchant: 'TechCorp India Pvt Ltd',
      type: 'credit',
      amount: 85000,
      notes: 'October 2026 Base Salary + HRA',
    });
    expect(result.suggestedCategory).toBe('Salary');
    expect(result.suggestedTransactionType).toBe('income');
    expect(result.confidence).toBeGreaterThanOrEqual(0.95);
    expect(result.needsReview).toBe(false);
  });

  it('correctly recognises freelance / consulting inflows as income', () => {
    const result = analyseTransaction({
      title: 'Freelance Consulting Payment',
      merchant: 'Acme Clients',
      type: 'credit',
      amount: 18000,
    });
    expect(result.suggestedCategory).toBe('Freelance');
    expect(result.suggestedTransactionType).toBe('income');
  });

  it('correctly identifies mutual fund SIP investments as investment contributions', () => {
    const result = analyseTransaction({
      title: 'Parag Parikh Flexi Cap Fund SIP',
      merchant: 'PPFAS Asset Management',
      type: 'debit',
      amount: 10000,
    });
    expect(result.suggestedCategory).toBe('Investment');
    expect(result.suggestedTransactionType).toBe('investment_contribution');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('correctly identifies loan repayments & EMIs', () => {
    const result = analyseTransaction({
      title: 'SBI Scholar Loan EMI #34',
      merchant: 'State Bank of India',
      type: 'debit',
      amount: 8500,
    });
    expect(result.suggestedCategory).toBe('Debt EMI');
    expect(result.suggestedTransactionType).toBe('loan_repayment');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('correctly flags internal transfers between own accounts', () => {
    const result = analyseTransaction({
      title: 'Self transfer to HDFC savings',
      merchant: 'Own account transfer',
      type: 'debit',
      amount: 15000,
    });
    expect(result.suggestedTransactionType).toBe('transfer');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('flags ambiguous transactions like ATM withdrawals for user review', () => {
    const result = analyseTransaction({
      title: 'ATM Cash Withdrawal HDFC Indiranagar',
      merchant: 'ATM Cash',
      type: 'debit',
      amount: 5000,
    });
    expect(result.needsReview).toBe(true);
    expect(result.confidence).toBeLessThan(0.7);
  });

  it('flags brokerage top-ups (e.g. Zerodha) for capital allocation verification', () => {
    const result = analyseTransaction({
      title: 'Broker Transfer to Zerodha Fund Ledger',
      merchant: 'Zerodha Fund',
      type: 'debit',
      amount: 25000,
    });
    expect(result.suggestedCategory).toBe('Investment');
    expect(result.needsReview).toBe(true);
  });

  it('prioritises user-defined custom merchant rules over default heuristics', () => {
    const customRules: TransactionRuleRecord[] = [
      {
        userId: 'user-123',
        ruleId: 'r-1',
        merchantPattern: 'Blue Tokai',
        category: 'Food',
        transactionType: 'expense',
        priority: 10,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
      {
        userId: 'user-123',
        ruleId: 'r-2',
        merchantPattern: 'Coursera',
        category: 'Education',
        transactionType: 'expense',
        priority: 10,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
    ];

    const result = analyseTransaction({
      title: 'Blue Tokai Coffee Beans Order',
      merchant: 'Blue Tokai Coffee Roasters',
      type: 'debit',
      amount: 680,
      userRules: customRules,
    });
    expect(result.suggestedCategory).toBe('Food');
    expect(result.confidence).toBe(1.0);
    expect(result.reason).toContain('Matched user custom merchant rule');
  });
});
