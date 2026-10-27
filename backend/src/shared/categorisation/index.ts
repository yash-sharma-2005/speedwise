import {
  TransactionCategory,
  FinancialClassification,
  TransactionType,
  TransactionRuleRecord,
} from '../../types/index.js';

export interface CategorisationResult {
  suggestedCategory: TransactionCategory;
  suggestedTransactionType: FinancialClassification;
  confidence: number; // 0.0 to 1.0
  reason: string;
  needsReview: boolean;
}

interface DefaultRule {
  pattern: RegExp;
  category: TransactionCategory;
  type: FinancialClassification;
  confidence: number;
  reason: string;
  needsReview?: boolean;
}

// Curated explainable rules for Indian commerce, UPI, banking, investments, and utilities
const DEFAULT_RULES: DefaultRule[] = [
  // 1. Internal Transfers & Cash Withdrawals
  {
    pattern: /own account|self transfer|transfer to self|internal transfer|to self a\/c/i,
    category: 'Other',
    type: 'transfer',
    confidence: 0.95,
    reason: 'Explicitly matches internal transfer between personal accounts.',
  },
  {
    pattern: /atm cash|cash withdrawal|atm wdl|cash wd/i,
    category: 'Other',
    type: 'expense',
    confidence: 0.65,
    reason: 'Cash withdrawal detected. Categorization ambiguous without itemized cash receipt.',
    needsReview: true,
  },

  // 2. Salary & Income
  {
    pattern: /salary credit|monthly salary|payroll|techcorp|stipend|wages/i,
    category: 'Salary',
    type: 'income',
    confidence: 0.98,
    reason: 'Direct corporate payroll / salary deposit marker found in narration.',
  },
  {
    pattern: /freelance|consulting|client payment|invoice payout|acme clients/i,
    category: 'Freelance',
    type: 'income',
    confidence: 0.92,
    reason: 'Freelance or business consulting receipt pattern identified.',
  },

  // 3. Brokerage / Investment Platforms (requires review per prompt requirements)
  {
    pattern: /zerodha fund|groww add funds|broker transfer|brokerage|groww|zerodha/i,
    category: 'Investment',
    type: 'investment_contribution',
    confidence: 0.72,
    reason: 'Brokerage ledger top-up or platform transfer detected. Flagged for review of ultimate capital allocation.',
    needsReview: true,
  },
  // Regulated Mutual Funds & Sovereign instruments (high confidence)
  {
    pattern: /parag parikh|ppfas|uti mutual|index fund|kuvera|cams|kfin|mutual fund sip|mf sip|sgb|sovereign gold|provident fund|ppf/i,
    category: 'Investment',
    type: 'investment_contribution',
    confidence: 0.95,
    reason: 'Recognized regulated AMC, mutual fund SIP auto-debit, or sovereign investment vehicle.',
    needsReview: false,
  },

  // 4. Debt & Loan EMIs
  {
    pattern: /loan emi|scholar loan|home loan emi|auto loan emi|smartemi|bajaj finance|hdb finance|hdfc emi|sbi loan/i,
    category: 'Debt EMI',
    type: 'loan_repayment',
    confidence: 0.96,
    reason: 'Matches regulated lending institution EMI schedule.',
  },

  // 5. Food & Dining
  {
    pattern: /swiggy|zomato|eatclub|dominos|mcdonald|starbucks|chai point|blue tokai|third wave|truffles|restaurant|cafe|bakery/i,
    category: 'Food',
    type: 'expense',
    confidence: 0.95,
    reason: 'Matched prominent dining, cafe, or online food delivery brand.',
  },
  {
    pattern: /blinkit|zepto|instamart|bb daily|bigbasket|supermarket|grocery|grocer|fruits/i,
    category: 'Food',
    type: 'expense',
    confidence: 0.93,
    reason: 'Identified grocery or quick-commerce merchant pattern.',
  },

  // 6. Bills & Utilities
  {
    pattern: /bescom|electricity|power bill|broadband|act fibernet|airtel|jio|vodafone|gas bill|water supply|billpay/i,
    category: 'Bills',
    type: 'expense',
    confidence: 0.95,
    reason: 'Recognized recurring utility, telecommunication, or broadband biller.',
  },

  // 7. Travel & Commute
  {
    pattern: /uber|ola|rapido|namma metro|bmrcl|irctc|makemytrip|indigo|flight|petrol|fuel|hpcl|bpcl|iocl/i,
    category: 'Travel',
    type: 'expense',
    confidence: 0.94,
    reason: 'Identified urban transit, cab aggregator, airline, or fuel merchant.',
  },

  // 8. Shopping & E-Commerce
  {
    pattern: /amazon|flipkart|myntra|zara|h&m|ikea|reliance retail|croma|decathlon|ajio|shopping/i,
    category: 'Shopping',
    type: 'expense',
    confidence: 0.94,
    reason: 'Matches major retail e-commerce or apparel brand.',
  },

  // 9. Healthcare & Pharmacy
  {
    pattern: /apollo|pharmacy|1mg|pharmeasy|hospital|clinic|diagnostics|dr\.?|medplus/i,
    category: 'Healthcare',
    type: 'expense',
    confidence: 0.95,
    reason: 'Recognized licensed pharmacy or healthcare clinic provider.',
  },

  // 10. Education
  {
    pattern: /coursera|udemy|edx|upgrad|tuition|school fee|college fee|university|books/i,
    category: 'Education',
    type: 'expense',
    confidence: 0.93,
    reason: 'Identified accredited education platform or institutional fee payment.',
  },

  // 11. Entertainment & OTT
  {
    pattern: /netflix|spotify|prime video|hotstar|bookmyshow|pvr|inox|youtube premium/i,
    category: 'Entertainment',
    type: 'expense',
    confidence: 0.96,
    reason: 'Identified registered digital streaming service or cinema operator.',
  },
];

/**
 * Smart Transaction Analysis Engine:
 * Analyzes transaction title, merchant, direction, and metadata.
 * Applies user custom rules with highest priority, followed by explainable heuristic rules.
 */
export function analyseTransaction(params: {
  title: string;
  merchant?: string;
  type?: TransactionType;
  amount?: number;
  source?: string;
  notes?: string;
  userRules?: TransactionRuleRecord[];
}): CategorisationResult {
  const combinedText = `${params.title} ${params.merchant || ''} ${params.notes || ''}`.trim();
  const lowerText = combinedText.toLowerCase();

  // 1. User-defined custom rules have highest priority
  if (params.userRules && params.userRules.length > 0) {
    const sortedUserRules = [...params.userRules].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    for (const rule of sortedUserRules) {
      if (rule.merchantPattern && lowerText.includes(rule.merchantPattern.toLowerCase())) {
        return {
          suggestedCategory: rule.category,
          suggestedTransactionType: rule.transactionType || (params.type === 'credit' ? 'income' : 'expense'),
          confidence: 1.0,
          reason: `Matched user custom merchant rule for "${rule.merchantPattern}".`,
          needsReview: false,
        };
      }
    }
  }

  // 2. Curated rule matching
  for (const rule of DEFAULT_RULES) {
    if (rule.pattern.test(lowerText)) {
      // Direction sanity check: if credit, confirm if it's refund or income
      let transType = rule.type;
      if (params.type === 'credit' && rule.type === 'expense') {
        transType = 'refund';
      }

      return {
        suggestedCategory: rule.category,
        suggestedTransactionType: transType,
        confidence: rule.confidence,
        reason: rule.reason,
        needsReview: rule.needsReview ?? rule.confidence < 0.7,
      };
    }
  }

  // 3. Fallback based on transaction direction
  if (params.type === 'credit') {
    return {
      suggestedCategory: 'Freelance',
      suggestedTransactionType: 'income',
      confidence: 0.55,
      reason: 'Credit inbound inflow with unrecognized counterparty. Flagged for confirmation.',
      needsReview: true,
    };
  }

  return {
    suggestedCategory: 'Other',
    suggestedTransactionType: 'expense',
    confidence: 0.4,
    reason: 'No merchant or category pattern recognized in transaction description.',
    needsReview: true,
  };
}
