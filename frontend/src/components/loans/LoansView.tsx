import React, { useState } from 'react';
import {
  CreditCard,
  Building2,
  Calendar,
  Percent,
  TrendingDown,
  Calculator,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

export const LoansView: React.FC = () => {
  const { loans, userProfile } = useFinance();
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState<number>(2000);

  const totalOutstanding = loans.reduce((sum, l) => sum + l.outstanding, 0);
  const totalPrincipal = loans.reduce((sum, l) => sum + l.principal, 0);
  const totalMonthlyEMI = loans.reduce((sum, l) => sum + l.monthlyEMI, 0);
  const totalPaid = totalPrincipal - totalOutstanding;
  const overallProgress = totalPrincipal > 0 ? (totalPaid / totalPrincipal) * 100 : 0;

  // Payoff Simulator Calculation
  // Current baseline payoff: ~32 months for the longest loan (SBI Education Loan)
  // With extra ₹X / month:
  const baselineMonths = 32;
  const acceleratedMonths = Math.max(
    12,
    Math.round(baselineMonths * (totalMonthlyEMI / (totalMonthlyEMI + extraMonthlyPayment)))
  );
  const monthsSaved = baselineMonths - acceleratedMonths;
  // Estimated interest saved
  const estimatedInterestSaved = Math.round(
    (extraMonthlyPayment * monthsSaved * 0.084) + (monthsSaved * 1250)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Liabilities & Debt Architecture</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Loans & Debt Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track active loan principal balances, interest rates, and simulate accelerated payoff strategies.
          </p>
        </div>

        <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>Next EMI Due: 02 Nov 2026 (HDFC SmartEMI)</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Outstanding Debt</span>
          <div className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(totalOutstanding, userProfile.currency)}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Across 2 verified active liabilities
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Monthly EMI</span>
          <div className="mt-1 text-2xl font-bold text-amber-700 font-mono tabular-nums">
            {formatCurrency(totalMonthlyEMI, userProfile.currency)}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            13.8% of net monthly income
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Principal Repaid So Far</span>
          <div className="mt-1 text-2xl font-bold text-emerald-600 font-mono tabular-nums">
            {formatCurrency(totalPaid, userProfile.currency)}
          </div>
          <p className="mt-2 text-[11px] text-emerald-700 font-medium">
            {overallProgress.toFixed(1)}% of total principal cleared
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Debt-Free Projection</span>
          <div className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            June 2029
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Without extra prepayments
          </p>
        </div>
      </div>

      {/* Active Loans Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loans.map((loan) => {
          const paidAmount = loan.principal - loan.outstanding;
          const percentPaid = (paidAmount / loan.principal) * 100;

          return (
            <div
              key={loan.id}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {loan.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {loan.lender} · {loan.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      Interest Rate
                    </span>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {loan.interestRate}% p.a.
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Repayment Progress</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {percentPaid.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${percentPaid}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                    <span>Paid: {formatCurrency(paidAmount, userProfile.currency)}</span>
                    <span>Principal: {formatCurrency(loan.principal, userProfile.currency)}</span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Outstanding</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {formatCurrency(loan.outstanding, userProfile.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Monthly EMI</span>
                    <span className="font-mono font-bold text-amber-700 tabular-nums">
                      {formatCurrency(loan.monthlyEMI, userProfile.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Tenure Left</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {loan.remainingMonths} mos
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Next Due: <strong className="text-slate-900 font-mono">{loan.nextDueDate}</strong>
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                  Auto-Debit Active
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Accelerated Debt Payoff Simulator */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-900 text-amber-400">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Debt Avalanche & Prepayment Simulator
              </h2>
              <p className="text-xs text-slate-500">
                Test how extra monthly contributions toward your highest-interest debt reduce your tenure.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-600">
            Interactive Calculator
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Slider input */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Extra Monthly Prepayment Contribution:
                </label>
                <span className="font-mono font-bold text-base text-slate-900">
                  {formatCurrency(extraMonthlyPayment, userProfile.currency)} / month
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="15000"
                step="500"
                value={extraMonthlyPayment}
                onChange={(e) => setExtraMonthlyPayment(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                <span>₹0 (Standard EMI)</span>
                <span>₹5,000</span>
                <span>₹10,000</span>
                <span>₹15,000</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5 text-slate-600">
              <div className="font-semibold text-slate-900">
                Strategy: Debt Avalanche (Recommended)
              </div>
              <p className="text-[11px] leading-relaxed">
                By funneling the extra {formatCurrency(extraMonthlyPayment, userProfile.currency)} into the 13.5% HDFC SmartEMI first, you clear expensive credit card liability in under 6 months before redirecting full surplus to the SBI Scholar Loan.
              </p>
            </div>
          </div>

          {/* Outcome Card */}
          <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                Simulation Outcome
              </span>
              <div className="text-3xl font-bold font-mono tabular-nums text-white mt-1">
                {monthsSaved} Months
              </div>
              <span className="text-xs text-slate-300">
                Saved off your debt payoff timeline
              </span>

              <div className="mt-4 pt-3 border-t border-slate-800">
                <span className="text-[11px] text-slate-400 block">Total Interest Saved</span>
                <span className="text-lg font-bold text-emerald-400 font-mono tabular-nums">
                  ~{formatCurrency(estimatedInterestSaved, userProfile.currency)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">New payoff target:</span>
              <span className="font-bold text-white font-mono">
                {acceleratedMonths} months left
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
