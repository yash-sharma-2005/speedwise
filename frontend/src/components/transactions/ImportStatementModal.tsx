import React, { useState } from 'react';
import { X, ArrowDownToLine, CheckCircle2, FileText, Sparkles, RefreshCw } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { TransactionCategory, TransactionType } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';

interface ParsedTransactionDraft {
  title: string;
  merchant: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: string;
  source: string;
  upiRef?: string;
  notes?: string;
}

const SAMPLE_STATEMENTS = [
  {
    name: 'Weekend UPI & Cafe Spends',
    text: `Paid Rs. 480 to SWIGGY via Google Pay UPI on 26-Oct-2026. Ref: 42918290.
Debited Rs. 240 at CHAI POINT via PhonePe on 27-Oct-2026. Ref: 991823.
Debited Rs. 850 at BLINKIT GROCERY via Google Pay on 27-Oct-2026. Ref: 110948.`,
  },
  {
    name: 'Freelance Inflow & Utilities',
    text: `Rs. 18,000 credited to ICICI Bank A/c on 26-Oct-2026 from ACME CLIENTS towards Design System Consulting.
Debited INR 2,400 on HDFC Card at RELIANCE DIGITAL on 25-Oct-2026 for Type-C Hub.
Paid Rs. 1,450 to UBER INDIA via Paytm on 25-Oct-2026 for Airport Trip.`,
  },
];

export const ImportStatementModal: React.FC = () => {
  const { isImportModalOpen, setIsImportModalOpen, importTransactionsBatch, userProfile } = useFinance();
  const [statementText, setStatementText] = useState(SAMPLE_STATEMENTS[0].text);
  const [parsedItems, setParsedItems] = useState<ParsedTransactionDraft[]>([]);
  const [isParsed, setIsParsed] = useState(false);

  if (!isImportModalOpen) return null;

  // Simple heuristic parser for SMS / CSV lines
  const parseStatement = () => {
    const lines = statementText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const drafts: ParsedTransactionDraft[] = [];

    lines.forEach((line) => {
      // Find amount (Rs. X or INR X)
      const amtMatch = line.match(/(?:Rs\.?|INR)\s*([\d,]+(?:\.\d+)?)/i);
      const amount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : 500;

      // Determine type
      const isCredit = /credit|credited|received|deposit/i.test(line);
      const type: TransactionType = isCredit ? 'credit' : 'debit';

      // Detect merchant / title
      let merchant = 'Unknown Merchant';
      let title = line.slice(0, 40);
      let category: TransactionCategory = 'Other';

      if (/swiggy|zomato|chai|coffee|restaurant|truffles/i.test(line)) {
        category = 'Food';
        merchant = /swiggy/i.test(line) ? 'Swiggy' : /chai/i.test(line) ? 'Chai Point' : 'Dining Out';
        title = `${merchant} Order`;
      } else if (/blinkit|zepto|grocer|fruits/i.test(line)) {
        category = 'Food';
        merchant = 'Blinkit Grocery';
        title = 'Quick Grocery Delivery';
      } else if (/uber|ola|metro|fuel|petrol/i.test(line)) {
        category = 'Travel';
        merchant = /uber/i.test(line) ? 'Uber India' : 'City Commute';
        title = `${merchant} Commute`;
      } else if (/amazon|flipkart|zara|reliance/i.test(line)) {
        category = 'Shopping';
        merchant = /amazon/i.test(line) ? 'Amazon India' : 'Retail Shopping';
        title = `${merchant} Purchase`;
      } else if (/bescom|electricity|broadband|airtel|jio/i.test(line)) {
        category = 'Bills';
        merchant = 'Utility Provider';
        title = 'Utility Bill Payment';
      } else if (isCredit) {
        category = 'Freelance';
        merchant = 'Client Wire';
        title = 'Freelance Consulting Payment';
      }

      // Detect channel
      let source = 'UPI - Google Pay';
      if (/phonepe/i.test(line)) source = 'UPI - PhonePe';
      else if (/paytm/i.test(line)) source = 'UPI - Paytm';
      else if (/hdfc/i.test(line)) source = 'HDFC Bank';
      else if (/icici/i.test(line)) source = 'ICICI Salary A/c';

      // Ref match
      const refMatch = line.match(/Ref:?\s*([A-Za-z0-9]+)/i);
      const upiRef = refMatch ? `UPI-${refMatch[1]}` : `IMP-${Date.now().toString().slice(-6)}`;

      drafts.push({
        title,
        merchant,
        amount,
        type,
        category,
        date: '2026-10-27',
        source,
        upiRef,
        notes: `Imported via Statement Parser: "${line}"`,
      });
    });

    setParsedItems(drafts);
    setIsParsed(true);
  };

  const handleBatchConfirm = () => {
    if (parsedItems.length === 0) return;
    importTransactionsBatch(
      parsedItems.map((p) => ({
        ...p,
        status: 'completed',
      }))
    );
    setIsImportModalOpen(false);
    setIsParsed(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-emerald-400 rounded-lg">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                Import Bank & UPI Statement
              </h2>
              <p className="text-xs text-slate-500">
                Paste bank SMS alerts, UPI transaction texts, or select a sample batch.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsImportModalOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset chips */}
        <div className="mt-4">
          <span className="text-xs font-semibold text-slate-700 block mb-2">
            Try Sample Statement Datasets:
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_STATEMENTS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setStatementText(sample.text);
                  setIsParsed(false);
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 transition-colors"
              >
                {sample.name}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input Area */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Statement / SMS Text (1 transaction per line)
          </label>
          <textarea
            rows={4}
            value={statementText}
            onChange={(e) => {
              setStatementText(e.target.value);
              setIsParsed(false);
            }}
            placeholder="Paste your bank SMS notices or exported text here..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={parseStatement}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Parse & Preview Statement</span>
          </button>
        </div>

        {/* Live Parsed Preview Table */}
        {isParsed && (
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Parsed Drafts ({parsedItems.length} records detected)
              </span>
              <span className="text-[11px] text-slate-500">
                Verify categories and amounts below before saving
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                  <tr>
                    <th className="py-2 px-3">Title / Merchant</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Channel</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {parsedItems.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-900">
                        <div>{item.title}</div>
                        <div className="text-[10px] text-slate-400">{item.merchant}</div>
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={item.category}
                          onChange={(e) => {
                            const updated = [...parsedItems];
                            updated[i].category = e.target.value as TransactionCategory;
                            setParsedItems(updated);
                          }}
                          className="px-1.5 py-0.5 border border-slate-200 rounded text-[11px] bg-white"
                        >
                          {['Food', 'Shopping', 'Travel', 'Bills', 'Freelance', 'Education', 'Healthcare', 'Entertainment', 'Other'].map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">
                        {item.source}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold tabular-nums">
                        <span className={item.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'}>
                          {item.type === 'credit' ? '+' : '-'}
                          {formatCurrency(item.amount, userProfile.currency)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsParsed(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleBatchConfirm}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm & Add {parsedItems.length} Transactions</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
