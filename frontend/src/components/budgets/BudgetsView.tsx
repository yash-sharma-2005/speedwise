import React, { useState } from 'react';
import {
  PieChart as PieIcon,
  Plus,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Percent,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { Budget, TransactionCategory } from '../../types/finance';

export const BudgetsView: React.FC = () => {
  const { budgets, addBudget, updateBudget, userProfile } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState<TransactionCategory>('Shopping');
  const [monthlyLimit, setMonthlyLimit] = useState('');

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overallSpentPercent = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(monthlyLimit);
    if (isNaN(limit) || limit <= 0) return;

    // Check if category already has budget
    const existing = budgets.find((b) => b.category === category);
    if (existing) {
      updateBudget(existing.id, { monthlyLimit: limit });
    } else {
      addBudget({
        category,
        monthlyLimit: limit,
        spent: 0,
        period: 'October 2026',
      });
    }

    setIsModalOpen(false);
    setMonthlyLimit('');
  };

  const categories: TransactionCategory[] = [
    'Shopping',
    'Food',
    'Travel',
    'Bills',
    'Education',
    'Healthcare',
    'Entertainment',
    'Other',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <PieIcon className="w-3.5 h-3.5" />
            <span>Spending Caps & Allocation</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Category Budgets & Limits
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor expenditure pacing against configured thresholds for October 2026.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Set Budget Limit</span>
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Budget Allocated</span>
          <div className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(totalBudgeted, userProfile.currency)}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Across {budgets.length} living expense categories
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Consumed</span>
          <div className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(totalSpent, userProfile.currency)}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {overallSpentPercent.toFixed(1)}% of planned limits consumed
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Remaining Room</span>
          <div className="mt-1 text-2xl font-bold text-emerald-600 font-mono tabular-nums">
            {formatCurrency(Math.max(0, totalBudgeted - totalSpent), userProfile.currency)}
          </div>
          <p className="mt-2 text-[11px] text-emerald-700 font-medium">
            4 days remaining in October
          </p>
        </div>
      </div>

      {/* 50/30/20 Rule Analysis Box */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              The 50 / 30 / 20 Budget Rule Check
            </h2>
            <p className="text-xs text-slate-500">
              Benchmarked against your ₹85,000 monthly take-home salary
            </p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded">
            Healthy Financial Profile
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-bold text-slate-900">1. Needs (Target: 50%)</span>
              <span className="font-mono text-emerald-700 font-semibold">22.2%</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Rent, bills, groceries, loan EMI commitments.
            </p>
            <div className="font-mono font-bold text-xs text-slate-900">
              {formatCurrency(18900, userProfile.currency)} / ₹42,500 target
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-bold text-slate-900">2. Wants (Target: 30%)</span>
              <span className="font-mono text-indigo-700 font-semibold">16.7%</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Shopping, dining out, weekend leisure, OTT.
            </p>
            <div className="font-mono font-bold text-xs text-slate-900">
              {formatCurrency(14200, userProfile.currency)} / ₹25,500 target
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-bold text-slate-900">3. Savings & Wealth (Target: 20%)</span>
              <span className="font-mono text-emerald-700 font-semibold">61.1%</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Mutual funds SIPs + unspent liquid cash retained.
            </p>
            <div className="font-mono font-bold text-xs text-emerald-700">
              {formatCurrency(51900, userProfile.currency)} / ₹17,000 target
            </div>
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((b) => {
          const ratio = (b.spent / b.monthlyLimit) * 100;
          const isWarning = ratio >= 70 && ratio < 90;
          const isDanger = ratio >= 90;

          const statusColor = isDanger
            ? 'bg-rose-500'
            : isWarning
            ? 'bg-amber-500'
            : 'bg-emerald-500';

          return (
            <div
              key={b.id}
              className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2">
                  <h3 className="font-bold text-sm text-slate-900">{b.category}</h3>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      isDanger
                        ? 'bg-rose-50 text-rose-700'
                        : isWarning
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {ratio.toFixed(0)}% Used
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Spent: <strong className="text-slate-900 font-mono">{formatCurrency(b.spent, userProfile.currency)}</strong></span>
                    <span>Limit: <strong className="text-slate-700 font-mono">{formatCurrency(b.monthlyLimit, userProfile.currency)}</strong></span>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${statusColor}`}
                      style={{ width: `${Math.min(100, ratio)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Remaining: <strong className="font-mono text-slate-900">{formatCurrency(Math.max(0, b.monthlyLimit - b.spent), userProfile.currency)}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newLimit = window.prompt(`Update monthly limit for ${b.category}:`, b.monthlyLimit.toString());
                    if (newLimit && !isNaN(parseFloat(newLimit))) {
                      updateBudget(b.id, { monthlyLimit: parseFloat(newLimit) });
                    }
                  }}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Edit Limit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Set Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Set Category Budget</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBudget} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Monthly Limit (₹) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 8000"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-semibold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold text-xs hover:bg-slate-800"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
