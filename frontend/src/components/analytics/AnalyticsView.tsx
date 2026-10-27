import React from 'react';
import {
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

export const AnalyticsView: React.FC = () => {
  const { summary, userProfile } = useFinance();

  // Net worth calculation
  const totalAssets = summary.availableBalance + summary.totalInvestments;
  const totalLiabilities = summary.outstandingDebt;
  const netWorth = totalAssets - totalLiabilities;

  // Month-over-Month historical trends (6 months)
  const momData = [
    { month: 'May 26', income: 82000, expenses: 23100, savings: 35400, netWorth: -138000 },
    { month: 'Jun 26', income: 82000, expenses: 25400, savings: 33100, netWorth: -129000 },
    { month: 'Jul 26', income: 85000, expenses: 22800, savings: 38700, netWorth: -118000 },
    { month: 'Aug 26', income: 85000, expenses: 26100, savings: 35400, netWorth: -108000 },
    { month: 'Sep 26', income: 85000, expenses: 23900, savings: 37600, netWorth: -98000 },
    { month: 'Oct 26', income: 85000, expenses: 24650, savings: 36850, netWorth: -92650 },
  ];

  // Spending by day of week
  const dayOfWeekSpending = [
    { day: 'Mon', spend: 2850 },
    { day: 'Tue', spend: 2100 },
    { day: 'Wed', spend: 1950 },
    { day: 'Thu', spend: 3200 },
    { day: 'Fri', spend: 4650 },
    { day: 'Sat', spend: 5800 },
    { day: 'Sun', spend: 4100 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Macro Financial Analytics</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Analytics & Net Worth Trajectory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Holistic view of asset accumulation, debt reduction velocity, and week-over-week trends.
          </p>
        </div>

        <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>Trailing 6-Month Period</span>
        </div>
      </div>

      {/* Net Worth Balance Sheet Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Personal Balance Sheet & Net Worth
            </h2>
            <p className="text-xs text-slate-500">
              Assets (Investments + Liquid Cash) minus Liabilities (Outstanding Debt)
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-medium text-slate-400 block">Calculated Net Worth</span>
            <span
              className={`text-lg font-bold font-mono tabular-nums ${
                netWorth >= 0 ? 'text-emerald-600' : 'text-slate-900'
              }`}
            >
              {formatCurrency(netWorth, userProfile.currency)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block">Total Real Assets</span>
            <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {formatCurrency(totalAssets, userProfile.currency)}
            </div>
            <div className="mt-2 text-[11px] text-slate-500 space-y-0.5 font-mono">
              <div>Investments: {formatCurrency(summary.totalInvestments, userProfile.currency)}</div>
              <div>Liquid Cash: {formatCurrency(summary.availableBalance, userProfile.currency)}</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block">Total Liabilities</span>
            <div className="text-xl font-bold text-amber-700 font-mono tabular-nums mt-1">
              {formatCurrency(totalLiabilities, userProfile.currency)}
            </div>
            <div className="mt-2 text-[11px] text-slate-500 space-y-0.5 font-mono">
              <div>SBI Education Loan: ₹2,45,000</div>
              <div>HDFC SmartEMI: ₹35,000</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <span className="text-xs font-semibold text-emerald-800 block">Trajectory Velocity</span>
            <div className="text-xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
              +₹45,350
            </div>
            <p className="mt-2 text-[11px] text-emerald-800 leading-relaxed">
              Net worth increased by ₹45,350 since May 2026 thanks to steady principal paydown and SIP compounding.
            </p>
          </div>
        </div>
      </div>

      {/* 2-Column Split: Historical Net Worth Growth + Day-of-Week Spends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Net Worth Area Chart */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Net Worth Recovery Curve
            </h3>
            <p className="text-xs text-slate-500">
              Tracking the progression toward positive net worth
            </p>
          </div>

          <div className="h-[260px] mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={momData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => `-₹${Math.abs(val) / 1000}k`}
                />
                <Tooltip
                  formatter={(val: any) => [
                    formatCurrency(Number(val), userProfile.currency),
                    'Net Worth',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#netWorthGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day-of-Week Spending Heat / Bar */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Day-of-Week Expense Intensity
            </h3>
            <p className="text-xs text-slate-500">
              Identify habitual spending peaks across weekdays and weekends
            </p>
          </div>

          <div className="h-[260px] mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekSpending} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  formatter={(val: any) => [
                    formatCurrency(Number(val), userProfile.currency),
                    'Expenditure',
                  ]}
                />
                <Bar dataKey="spend" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
