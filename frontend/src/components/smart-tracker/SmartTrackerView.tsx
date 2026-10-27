import React from 'react';
import {
  Zap,
  Repeat,
  Coffee,
  AlertTriangle,
  Smartphone,
  Calendar,
  CreditCard,
  Clock,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const SmartTrackerView: React.FC = () => {
  const { transactions, userProfile } = useFinance();

  // 1. UPI Velocity & Stats
  const upiTransactions = transactions.filter((t) =>
    t.source.toLowerCase().includes('upi')
  );
  const upiTotalSpend = upiTransactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  // 2. Micro-Spends Radar (Transactions under ₹200)
  const microSpends = transactions.filter(
    (t) => t.type === 'debit' && t.amount <= 250
  );
  const microSpendsTotal = microSpends.reduce((sum, t) => sum + t.amount, 0);

  // 3. Recurring Subscriptions & Mandates
  const recurringItems = [
    {
      name: 'Netflix 4K Premium',
      amount: 649,
      frequency: 'Monthly',
      channel: 'HDFC Card Auto-Debit',
      nextDate: '25 Nov 2026',
      category: 'Entertainment',
    },
    {
      name: 'Spotify Premium Family',
      amount: 179,
      frequency: 'Monthly',
      channel: 'UPI AutoPay (Google Pay)',
      nextDate: '26 Nov 2026',
      category: 'Entertainment',
    },
    {
      name: 'ACT Fibernet 300Mbps',
      amount: 1475,
      frequency: 'Monthly',
      channel: 'HDFC BillPay',
      nextDate: '20 Nov 2026',
      category: 'Bills',
    },
    {
      name: 'Airtel Postpaid 5G Family',
      amount: 1145,
      frequency: 'Monthly',
      channel: 'Auto-Debit',
      nextDate: '26 Nov 2026',
      category: 'Bills',
    },
    {
      name: 'Parag Parikh SIP Mandate',
      amount: 10000,
      frequency: 'Monthly',
      channel: 'NACH Mandate',
      nextDate: '05 Nov 2026',
      category: 'Investment',
    },
    {
      name: 'UTI Nifty 50 SIP Mandate',
      amount: 5000,
      frequency: 'Monthly',
      channel: 'NACH Mandate',
      nextDate: '05 Nov 2026',
      category: 'Investment',
    },
  ];

  const totalMonthlyRecurring = recurringItems.reduce((acc, item) => acc + item.amount, 0);

  // Frequent UPI Payees
  const frequentPayees = [
    { name: 'Swiggy Food & Instamart', count: 6, total: 3240, icon: '🍔' },
    { name: 'Chai Point & Local Cafes', count: 8, total: 1420, icon: '☕' },
    { name: 'Blinkit Quick Delivery', count: 4, total: 1890, icon: '⚡' },
    { name: 'Uber & Metro Commute', count: 5, total: 2450, icon: '🚗' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
            <Zap className="w-3.5 h-3.5" />
            <span>UPI Intelligence & Subscriptions</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Smart Spending Analyzer
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Detect hidden micro-leaks, monitor recurring mandates, and analyze UPI velocity.
          </p>
        </div>

        <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
          <Smartphone className="w-4 h-4 text-emerald-600" />
          <span>Active UPI Accounts: 3 (GPay, PhonePe, Paytm)</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* UPI Volume */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Monthly UPI Outflow</span>
            <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-700">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {formatCurrency(upiTotalSpend, userProfile.currency)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {upiTransactions.length} recorded UPI transactions this month
            </p>
          </div>
        </div>

        {/* Micro-Spends Leak Radar */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Micro-Spends (&lt; ₹250)</span>
            <div className="p-1.5 rounded-md bg-amber-50 text-amber-700">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {formatCurrency(microSpendsTotal, userProfile.currency)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tea, snacks, quick deliveries quietly add up to ~₹{Math.round(microSpendsTotal * 12).toLocaleString()} / year
            </p>
          </div>
        </div>

        {/* Recurring Mandates Total */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Mandates & SIPs</span>
            <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {formatCurrency(totalMonthlyRecurring, userProfile.currency)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              6 verified automated standing instructions
            </p>
          </div>
        </div>
      </div>

      {/* 2-Column Split: Frequent UPI Merchants & Recurring Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Frequent Payees */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Frequent UPI Payees
              </h2>
              <p className="text-xs text-slate-500">
                Top recipients by frequency in October 2026
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              Sorted by volume
            </span>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {frequentPayees.map((payee, i) => (
              <div
                key={i}
                className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm">
                    {payee.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {payee.name}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {payee.count} transactions recorded
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-xs text-slate-900 tabular-nums">
                    {formatCurrency(payee.total, userProfile.currency)}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    avg {formatCurrency(Math.round(payee.total / payee.count), userProfile.currency)}/tx
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Smart Tip */}
          <div className="mt-4 p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg flex items-start gap-2.5 text-xs">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-indigo-900 leading-relaxed text-[11px]">
              <strong>Pro Tip:</strong> 42% of your UPI spends occur on Friday and Saturday evenings. Setting a weekend UPI budget alert could save up to ₹3,500/month.
            </p>
          </div>
        </div>

        {/* Subscriptions & Standing Instructions */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Recurring Subscriptions & Mandates
              </h2>
              <p className="text-xs text-slate-500">
                Scheduled e-mandates, OTT, broadband, and SIPs
              </p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              All Active
            </span>
          </div>

          <div className="mt-3 divide-y divide-slate-100 max-h-[310px] overflow-y-auto pr-1">
            {recurringItems.map((item, idx) => (
              <div
                key={idx}
                className="py-2.5 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-lg transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {item.name}
                    </h4>
                    <span className="text-[10px] text-slate-400">·</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {item.channel} · Next: {item.nextDate}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-xs text-slate-900 tabular-nums">
                    {formatCurrency(item.amount, userProfile.currency)}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {item.frequency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
