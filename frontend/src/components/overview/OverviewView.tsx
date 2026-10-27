import React from 'react';
import { Plus, ArrowDownToLine, Calendar, Sparkles } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { SummaryCards } from './SummaryCards';
import { CashFlowChart } from './CashFlowChart';
import { CategoryDonutChart } from './CategoryDonutChart';
import { RecentTransactions } from './RecentTransactions';
import { FinancialInsights } from './FinancialInsights';

export const OverviewView: React.FC = () => {
  const {
    userProfile,
    dateRange,
    setDateRange,
    setIsAddTxModalOpen,
    setIsImportModalOpen,
  } = useFinance();

  const firstName = userProfile.name.split(' ')[0] || 'Alex';

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>October Financial Statement Active</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Good morning, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Here's your financial overview for {dateRange}.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Date Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{dateRange}</span>
          </div>

          {/* Import Statement */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-all whitespace-nowrap"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-slate-500" />
            <span>Import Statement</span>
          </button>

          {/* Add Transaction */}
          <button
            type="button"
            onClick={() => setIsAddTxModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-all whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* 6 Summary Cards */}
      <section aria-label="Financial Summary Cards">
        <SummaryCards />
      </section>

      {/* Financial Cash Flow + Category Donut Split */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-label="Charts Analysis">
        <div className="lg:col-span-2">
          <CashFlowChart />
        </div>
        <div className="lg:col-span-1">
          <CategoryDonutChart />
        </div>
      </section>

      {/* Financial Insights Panel */}
      <section aria-label="Intelligent Financial Insights">
        <FinancialInsights />
      </section>

      {/* Recent Transactions Ledger Table */}
      <section aria-label="Recent Transactions">
        <RecentTransactions />
      </section>
    </div>
  );
};
