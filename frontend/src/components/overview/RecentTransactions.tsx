import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingBag,
  Utensils,
  Car,
  Zap,
  GraduationCap,
  HeartPulse,
  Tv,
  TrendingUp,
  CreditCard,
  Briefcase,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { TransactionCategory } from '../../types/finance';

const CATEGORY_ICONS: Record<TransactionCategory, React.ComponentType<{ className?: string }>> = {
  Salary: Briefcase,
  Freelance: Briefcase,
  Shopping: ShoppingBag,
  Food: Utensils,
  Travel: Car,
  Bills: Zap,
  Education: GraduationCap,
  Healthcare: HeartPulse,
  Entertainment: Tv,
  Investment: TrendingUp,
  'Debt EMI': CreditCard,
  Other: ShoppingBag,
};

export const RecentTransactions: React.FC = () => {
  const { transactions, setCurrentSection, userProfile, setSelectedCategoryFilter } = useFinance();

  // Take top 7 recent transactions
  const recent = transactions.slice(0, 7);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Table Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Recent Transactions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified payments, transfers, and automated recurring deductions.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedCategoryFilter(null);
            setCurrentSection('transactions');
          }}
          className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 group py-1 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all"
        >
          <span>View All Transactions</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-5">Merchant / Title</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 hidden md:table-cell">Account / Source</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {recent.map((tx) => {
              const Icon = CATEGORY_ICONS[tx.category] || ShoppingBag;
              const isCredit = tx.type === 'credit';

              return (
                <tr
                  key={tx.id}
                  className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                  onClick={() => {
                    setCurrentSection('transactions');
                  }}
                >
                  {/* Merchant & Title */}
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isCredit
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate max-w-[180px] sm:max-w-xs">
                          {tx.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {tx.merchant} {tx.upiRef && `· ${tx.upiRef}`}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4">
                    <span className="text-slate-600 font-medium">
                      {tx.category}
                    </span>
                  </td>

                  {/* Source / Account */}
                  <td className="py-3.5 px-4 hidden md:table-cell">
                    <span className="text-slate-500 text-[11px]">
                      {tx.source}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                    {formatDate(tx.date)}
                  </td>

                  {/* Amount with Debit/Credit Styling */}
                  <td className="py-3.5 px-4 text-right font-mono font-semibold tabular-nums whitespace-nowrap">
                    <span
                      className={
                        isCredit
                          ? 'text-emerald-600 font-bold'
                          : 'text-slate-900'
                      }
                    >
                      {isCredit ? '+' : '-'}
                      {formatCurrency(tx.amount, userProfile.currency)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="text-[11px] font-medium text-slate-600">
                      Completed
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
