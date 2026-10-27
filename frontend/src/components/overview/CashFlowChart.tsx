import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { CASH_FLOW_MONTHLY, CASH_FLOW_WEEKLY } from '../../data/mockData';
import { formatCurrency } from '../../utils/formatters';
import { useFinance } from '../../context/FinanceContext';

export const CashFlowChart: React.FC = () => {
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');
  const { userProfile } = useFinance();

  const data = (viewMode === 'monthly' ? CASH_FLOW_MONTHLY : CASH_FLOW_WEEKLY).map(
    (item: any) => ({
      period: item.month || item.week,
      income: item.income,
      expenses: item.expenses,
      investments: item.investments,
      loanRepayments: item.loanRepayments,
    })
  );

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-800 text-xs">
          <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1.5 mb-2">
            {label}
          </p>
          <div className="space-y-1.5">
            {payload.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-xs"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-300">{item.name}:</span>
                </div>
                <span className="font-mono font-semibold tabular-nums text-white">
                  {formatCurrency(item.value, userProfile.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col h-full">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Financial Cash-Flow Dynamics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare monthly inflows against consumption, investments, and debt obligations.
          </p>
        </div>

        {/* View toggle (Monthly vs Weekly) */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'monthly'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'weekly'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Breakdown
          </button>
        </div>
      </div>

      {/* Note about separation of flows */}
      <div className="py-2.5 flex items-center justify-between text-[11px] text-slate-500">
        <span>
          *Investments (SIPs) and Loan Principal repayments are tracked distinctly from ordinary consumption.
        </span>
      </div>

      {/* Recharts chart area */}
      <div className="flex-1 w-full min-h-[300px] mt-2">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />
            <XAxis
              dataKey="period"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(val) => `₹${val / 1000}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ paddingBottom: 14, fontSize: 12 }}
            />
            {/* Grouped Bars */}
            <Bar
              name="Income Inflow"
              dataKey="income"
              fill="#059669"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              name="Living Expenses"
              dataKey="expenses"
              fill="#e11d48"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              name="Investments"
              dataKey="investments"
              fill="#4f46e5"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              name="Loan EMI"
              dataKey="loanRepayments"
              fill="#d97706"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
