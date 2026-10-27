import React, { useState } from 'react';
import {
  TrendingUp,
  Plus,
  PieChart as PieIcon,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  Percent,
  X,
  Check,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { Investment, InvestmentType } from '../../types/finance';

export const InvestmentsView: React.FC = () => {
  const { investments, addInvestment, userProfile } = useFinance();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<InvestmentType>('Mutual Fund');
  const [investedAmount, setInvestedAmount] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [monthlySIP, setMonthlySIP] = useState('');

  // Calculations
  const totalCurrentValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
  const totalInvested = investments.reduce((sum, i) => sum + i.investedAmount, 0);
  const totalReturns = totalCurrentValue - totalInvested;
  const overallReturnPercent = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;
  const totalMonthlySIP = investments.reduce((sum, i) => sum + (i.monthlySIP || 0), 0);

  // Pie chart data by asset class
  const assetAllocation = React.useMemo(() => {
    const map: Record<string, number> = {};
    investments.forEach((i) => {
      map[i.type] = (map[i.type] || 0) + i.currentValue;
    });

    const colors: Record<string, string> = {
      'Mutual Fund': '#4f46e5',
      'Stocks': '#0284c7',
      'EPF / PPF': '#059669',
      'Gold / SGB': '#d97706',
      'Fixed Deposit': '#64748b',
      'Crypto': '#7c3aed',
    };

    return Object.entries(map).map(([typeName, value]) => ({
      name: typeName,
      value,
      color: colors[typeName] || '#94a3b8',
      percentage: totalCurrentValue > 0 ? Math.round((value / totalCurrentValue) * 100) : 0,
    }));
  }, [investments, totalCurrentValue]);

  const handleAddInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    const inv = parseFloat(investedAmount);
    const cur = parseFloat(currentValue);
    const sip = monthlySIP ? parseFloat(monthlySIP) : undefined;

    if (isNaN(inv) || isNaN(cur) || !name.trim()) return;

    const returns = cur - inv;
    const returnPercentage = inv > 0 ? (returns / inv) * 100 : 0;

    addInvestment({
      name: name.trim(),
      type,
      investedAmount: inv,
      currentValue: cur,
      returns,
      returnPercentage,
      monthlySIP: sip,
      nextDebitDate: sip ? '2026-11-05' : undefined,
      allocationPercentage: 0,
    });

    setIsAddModalOpen(false);
    setName('');
    setInvestedAmount('');
    setCurrentValue('');
    setMonthlySIP('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Wealth & Asset Portfolio</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Investment Portfolio & SIPs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time tracking of Mutual Funds, Index Funds, SGB Gold, and Provident Funds.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Investment</span>
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Current Portfolio Value</span>
          <div className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(totalCurrentValue, userProfile.currency)}
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Mark to market valuation</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Capital Invested</span>
          <div className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(totalInvested, userProfile.currency)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Principal capital deployed
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Unrealized Net Profit</span>
          <div className="mt-1 text-2xl font-bold text-emerald-600 font-mono tabular-nums">
            +{formatCurrency(totalReturns, userProfile.currency)}
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-semibold font-mono">
            {formatPercentage(overallReturnPercent)} all-time return
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Active Monthly SIPs</span>
          <div className="mt-1 text-2xl font-bold text-indigo-700 font-mono tabular-nums">
            {formatCurrency(totalMonthlySIP, userProfile.currency)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Debits scheduled on 5th of every month
          </div>
        </div>
      </div>

      {/* Asset Allocation Chart & Fund Ledger Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Allocation Donut */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Asset Class Allocation</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Diversification breakdown across asset classes
            </p>
          </div>

          <div className="h-[200px] relative my-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value), userProfile.currency)}
                />
                <Pie
                  data={assetAllocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {assetAllocation.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-slate-400">Total Holdings</span>
              <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                {formatCurrency(totalCurrentValue, userProfile.currency)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {assetAllocation.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-700 font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-400 text-[11px]">{item.percentage}%</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {formatCurrency(item.value, userProfile.currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Holdings Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recorded Holdings</h2>
              <p className="text-xs text-slate-500">
                Detailed view of current value, capital invested, and return percentage.
              </p>
            </div>
            <span className="text-xs text-slate-400">
              {investments.length} holdings
            </span>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold text-slate-500">
                  <th className="py-2.5 px-3">Asset / Scheme</th>
                  <th className="py-2.5 px-2">Type</th>
                  <th className="py-2.5 px-2 text-right">Invested</th>
                  <th className="py-2.5 px-2 text-right">Current Value</th>
                  <th className="py-2.5 px-2 text-right">Returns</th>
                  <th className="py-2.5 px-3 text-right">SIP / Month</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {investments.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 max-w-[200px] truncate">
                        {inv.name}
                      </div>
                      {inv.nextDebitDate && (
                        <div className="text-[10px] text-slate-400">
                          Next auto-debit: {inv.nextDebitDate}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-2">
                      <span className="text-slate-600 font-medium">
                        {inv.type}
                      </span>
                    </td>

                    <td className="py-3 px-2 text-right font-mono text-slate-600 tabular-nums">
                      {formatCurrency(inv.investedAmount, userProfile.currency)}
                    </td>

                    <td className="py-3 px-2 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatCurrency(inv.currentValue, userProfile.currency)}
                    </td>

                    <td className="py-3 px-2 text-right font-mono font-semibold tabular-nums">
                      <span className="text-emerald-600 block">
                        +{formatCurrency(inv.returns, userProfile.currency)}
                      </span>
                      <span className="text-[10px] text-emerald-700">
                        {formatPercentage(inv.returnPercentage)}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-700 tabular-nums">
                      {inv.monthlySIP ? (
                        formatCurrency(inv.monthlySIP, userProfile.currency)
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Investment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add New Investment</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddInvestment} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Scheme / Asset Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mirae Asset Large Cap Fund"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Asset Category
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as InvestmentType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                >
                  <option value="Mutual Fund">Mutual Fund</option>
                  <option value="Stocks">Stocks / Equities</option>
                  <option value="EPF / PPF">EPF / PPF</option>
                  <option value="Gold / SGB">Gold / SGB</option>
                  <option value="Fixed Deposit">Fixed Deposit</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Invested Capital (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="25000"
                    value={investedAmount}
                    onChange={(e) => setInvestedAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Current Valuation (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="28400"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Monthly SIP Amount (Optional)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={monthlySIP}
                  onChange={(e) => setMonthlySIP(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold text-xs hover:bg-slate-800 transition-colors"
                >
                  Save Investment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
