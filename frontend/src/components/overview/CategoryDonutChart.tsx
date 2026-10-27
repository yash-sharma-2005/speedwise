import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { ArrowRight } from 'lucide-react';

interface CategorySpend {
  name: string;
  value: number;
  color: string;
  percent: number;
}

export const CategoryDonutChart: React.FC = () => {
  const {
    summary,
    userProfile,
    setCurrentSection,
    setSelectedCategoryFilter,
  } = useFinance();

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Exact categories requested in prompt
  const CATEGORY_COLORS: Record<string, string> = {
    Shopping: '#3b82f6', // blue
    Food: '#f59e0b', // amber
    Travel: '#10b981', // emerald
    Bills: '#6366f1', // indigo
    Education: '#8b5cf6', // purple
    Healthcare: '#ec4899', // pink
    Entertainment: '#14b8a6', // teal
    Other: '#94a3b8', // slate
  };

  // Category breakdown matching total ₹24,650
  const categoryData: CategorySpend[] = [
    { name: 'Shopping', value: 7200, color: CATEGORY_COLORS.Shopping, percent: 29.2 },
    { name: 'Food', value: 5400, color: CATEGORY_COLORS.Food, percent: 21.9 },
    { name: 'Bills', value: 4800, color: CATEGORY_COLORS.Bills, percent: 19.5 },
    { name: 'Travel', value: 2450, color: CATEGORY_COLORS.Travel, percent: 9.9 },
    { name: 'Education', value: 1800, color: CATEGORY_COLORS.Education, percent: 7.3 },
    { name: 'Entertainment', value: 1600, color: CATEGORY_COLORS.Entertainment, percent: 6.5 },
    { name: 'Healthcare', value: 1400, color: CATEGORY_COLORS.Healthcare, percent: 5.7 },
  ];

  const totalExpense = summary.totalExpenses;

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategoryFilter(categoryName);
    setCurrentSection('transactions');
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as CategorySpend;
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-semibold">{data.name}</span>
          </div>
          <div className="text-slate-300 flex items-center justify-between gap-3">
            <span>Amount:</span>
            <span className="font-mono font-bold text-white">
              {formatCurrency(data.value, userProfile.currency)}
            </span>
          </div>
          <div className="text-slate-400 text-[10px] mt-0.5">
            {data.percent}% of monthly budget
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Spending by Category
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any category to filter the ledger.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedCategoryFilter(null);
            setCurrentSection('budgets');
          }}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 group"
        >
          <span>View Budgets</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Donut Chart with Center Total */}
      <div className="relative my-2 h-[220px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomPieTooltip />} />
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={88}
              paddingAngle={3}
              dataKey="value"
              onClick={(entry: any) => {
                if (entry && entry.name) {
                  handleCategoryClick(entry.name);
                }
              }}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {categoryData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="#ffffff"
                  strokeWidth={activeIndex === index ? 3 : 1}
                  style={{
                    filter: activeIndex === index ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total Value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] font-medium text-slate-400">Total Spent</span>
          <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(totalExpense, userProfile.currency)}
          </span>
          <span className="text-[10px] text-slate-500">October 2026</span>
        </div>
      </div>

      {/* Interactive Legend List */}
      <div className="mt-2 divide-y divide-slate-100 max-h-[160px] overflow-y-auto pr-1">
        {categoryData.map((cat, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleCategoryClick(cat.name)}
            className="w-full py-1.5 flex items-center justify-between text-xs hover:bg-slate-50 px-1.5 rounded transition-colors group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-slate-700 font-medium truncate group-hover:text-slate-900">
                {cat.name}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-slate-400 text-[11px] font-mono">
                {cat.percent}%
              </span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {formatCurrency(cat.value, userProfile.currency)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
