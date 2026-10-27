import { describe, it, expect } from 'vitest';
import { analyseTransaction } from '../src/shared/categorisation/index.js';
import { generateTransactionFingerprint, toPaise } from '../src/shared/financial/index.js';

describe('Statement Import & Processing Logic', () => {
  it('parses typical Indian bank SMS / statement lines and maps to canonical fields', () => {
    const sampleLine = 'Paid Rs. 480 to SWIGGY via Google Pay UPI on 26-Oct-2026. Ref: 42918290.';

    // Amount extraction
    const amtMatch = sampleLine.match(/(?:Rs\.?|INR)\s*([\d,]+(?:\.\d+)?)/i);
    expect(amtMatch).toBeTruthy();
    const amount = parseFloat(amtMatch![1].replace(/,/g, ''));
    expect(amount).toBe(480);

    // Analysis
    const analysis = analyseTransaction({
      title: 'Swiggy Order',
      merchant: 'SWIGGY',
      type: 'debit',
      amount,
      source: 'UPI - Google Pay',
    });
    expect(analysis.suggestedCategory).toBe('Food');
    expect(analysis.suggestedTransactionType).toBe('expense');
  });

  it('detects duplicate statement records using transaction fingerprinting', () => {
    const rawRecord1 = {
      date: '2026-10-26',
      amountInPaise: toPaise(480),
      merchant: 'SWIGGY',
      upiRef: '42918290',
      source: 'Google Pay',
    };

    const rawRecord2 = {
      date: '2026-10-26',
      amountInPaise: toPaise(480),
      merchant: 'SWIGGY',
      upiRef: '42918290',
      source: 'Google Pay',
    };

    const fp1 = generateTransactionFingerprint(rawRecord1);
    const fp2 = generateTransactionFingerprint(rawRecord2);

    expect(fp1).toBe(fp2);
  });

  it('correctly handles salary credits from corporate employers', () => {
    const creditLine = 'Rs. 85,000 credited to ICICI Bank A/c on 01-Oct-2026 from TECHCORP INDIA towards Monthly Salary';
    const isCredit = /credit|credited|deposit|received/i.test(creditLine);
    expect(isCredit).toBe(true);

    const analysis = analyseTransaction({
      title: 'Monthly Salary Credit',
      merchant: 'TECHCORP INDIA',
      type: 'credit',
      amount: 85000,
    });
    expect(analysis.suggestedCategory).toBe('Salary');
    expect(analysis.suggestedTransactionType).toBe('income');
  });
});
