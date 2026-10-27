import React from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  PiggyBank,
  CalendarClock,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useFinance, AppSection } from '../../context/FinanceContext';
import { FinancialInsight } from '../../types/finance';

export const FinancialInsights: React.FC = () => {
  const { insights, setCurrentSection } = useFinance();

  const getInsightIcon = (type: FinancialInsight['type']) => {
    switch (type) {
      case 'warning':
        return { icon: AlertCircle, color: 'text-amber-600 bg-amber-50' };
      case 'action':
        return { icon: TrendingUp, color: 'text-blue-600 bg-blue-50' };
      case 'positive':
        return { icon: PiggyBank, color: 'text-emerald-600 bg-emerald-50' };
      case 'info':
      default:
        return { icon: CalendarClock, color: 'text-indigo-600 bg-indigo-50' };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-900 text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Intelligent Financial Insights
            </h2>
            <p className="text-xs text-slate-500">
              Pattern detection from recorded sample transactions & statements.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
          Live Analysis
        </span>
      </div>

      {/* Insights Grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {insights.map((insight) => {
          const { icon: Icon, color } = getInsightIcon(insight.type);

          return (
            <div
              key={insight.id}
              onClick={() => setCurrentSection(insight.targetSection as AppSection)}
              className="p-3.5 rounded-lg border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className={`p-1.5 rounded-md ${color} shrink-0`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {insight.metric && (
                    <span className="text-[11px] font-semibold text-slate-700 font-mono tabular-nums">
                      {insight.metric}
                    </span>
                  )}
                </div>

                <h3 className="text-xs font-bold text-slate-900 group-hover:text-slate-950 transition-colors line-clamp-1">
                  {insight.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                  {insight.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium group-hover:text-slate-900">
                <span className="capitalize">Review {insight.targetSection}</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 group-hover:text-slate-900 transition-all" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtle note */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-400">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>
          Insights are computed locally from verified transactions and category budget thresholds.
        </span>
      </div>
    </div>
  );
};
