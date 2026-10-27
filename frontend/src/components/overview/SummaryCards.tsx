import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownRight,
  TrendingUp,
  CreditCard,
  Building2,
  Percent,
  HelpCircle,
  ArrowUpRight,
} from 'lucide-react';
import { useFinance, AppSection } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

interface SummaryCardItem {
  id: string;
  label: string;
  amount: number;
  isCurrency?: boolean;
  suffix?: string;
  comparison: string;
  isPositive: boolean;
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
  targetSection: AppSection;
  iconBg: string;
  iconColor: string;
}

export const SummaryCards: React.FC = () => {
  const { summary, setCurrentSection, userProfile } = useFinance();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const cards: SummaryCardItem[] = [
    {
      id: 'income',
      label: 'Total Income',
      amount: summary.totalIncome,
      isCurrency: true,
      comparison: '+3.6% vs Sep',
      isPositive: true,
      icon: Wallet,
      tooltip: 'Total earnings received this month from salary, freelancing, and dividends.',
      targetSection: 'transactions',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-700',
    },
    {
      id: 'expenses',
      label: 'Total Expenses',
      amount: summary.totalExpenses,
      isCurrency: true,
      comparison: '-2.8% vs Sep',
      isPositive: true, // Lower expenses is positive
      icon: ArrowDownRight,
      tooltip: 'Discretionary and essential consumption expenses. Excludes investments & EMI.',
      targetSection: 'transactions',
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-700',
    },
    {
      id: 'investments',
      label: 'Total Investments',
      amount: summary.totalInvestments,
      isCurrency: true,
      comparison: '+13.3% overall return',
      isPositive: true,
      icon: TrendingUp,
      tooltip: 'Total mark-to-market value of Mutual Funds, PPF, SGB Gold, and Stocks.',
      targetSection: 'investments',
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-700',
    },
    {
      id: 'debt',
      label: 'Outstanding Debt',
      amount: summary.outstandingDebt,
      isCurrency: true,
      comparison: '₹11,750 principal paid this month',
      isPositive: false,
      icon: CreditCard,
      tooltip: 'Remaining principal balances across SBI Education Loan and HDFC SmartEMI.',
      targetSection: 'loans',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-700',
    },
    {
      id: 'balance',
      label: 'Available Balance',
      amount: summary.availableBalance,
      isCurrency: true,
      comparison: 'HDFC & ICICI accounts',
      isPositive: true,
      icon: Building2,
      tooltip: 'Immediate liquid cash reserves available across connected savings accounts.',
      targetSection: 'transactions',
      iconBg: 'bg-cyan-50',
      iconColor: 'text-cyan-700',
    },
    {
      id: 'savings',
      label: 'Monthly Savings Rate',
      amount: summary.monthlySavingsRate,
      isCurrency: false,
      suffix: '%',
      comparison: 'Goal: 30% monthly target',
      isPositive: summary.monthlySavingsRate >= 25,
      icon: Percent,
      tooltip: 'Percentage of net monthly income retained after all living expenses and loan EMIs.',
      targetSection: 'budgets',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={() => setCurrentSection(card.targetSection)}
            className="group relative bg-white rounded-xl border border-slate-200/90 p-4 transition-all hover:border-slate-300 hover:shadow-xs cursor-pointer flex flex-col justify-between"
          >
            {/* Header: Icon + Tooltip trigger */}
            <div className="flex items-center justify-between gap-2">
              <div className={`p-2 rounded-lg ${card.iconBg} ${card.iconColor} shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>

              <div className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setActiveTooltip(card.id)}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTooltip(activeTooltip === card.id ? null : card.id);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  aria-label={`Info about ${card.label}`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>

                {/* Informative Tooltip */}
                {activeTooltip === card.id && (
                  <div className="absolute right-0 top-6 z-50 w-52 p-2.5 bg-slate-900 text-white text-[11px] leading-relaxed rounded-lg shadow-xl pointer-events-none">
                    {card.tooltip}
                  </div>
                )}
              </div>
            </div>

            {/* Metric Body */}
            <div className="mt-3">
              <span className="text-xs font-medium text-slate-500 block truncate">
                {card.label}
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
                  {card.isCurrency
                    ? formatCurrency(card.amount, userProfile.currency)
                    : `${card.amount}${card.suffix || ''}`}
                </span>
              </div>
            </div>

            {/* Comparison / Indicator footer */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 truncate">{card.comparison}</span>
              <span className="text-slate-400 group-hover:text-slate-900 transition-colors shrink-0 ml-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
