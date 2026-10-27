import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  ArrowDownToLine,
  Trash2,
  Edit2,
  Calendar,
  CreditCard,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingBag,
  Utensils,
  Car,
  Zap,
  GraduationCap,
  HeartPulse,
  Tv,
  TrendingUp,
  Briefcase,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Transaction, TransactionCategory, TransactionType } from '../../types/finance';

const CATEGORY_ICONS: Record<TransactionCategory, React.ComponentType<{ className?: string }>> = {
  Salary: Briefcase,
  Freelance: Briefcase,
  Shopping: ShoppingBag,
  Food: Utensils,
  Travel: Car,
  Bills: Zap,
  Education: GraduationCap,
  Healthcare: HeartPulse,
  Entertainment: Tv,
  Investment: TrendingUp,
  'Debt EMI': CreditCard,
  Other: ShoppingBag,
};

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    deleteTransaction,
    setIsAddTxModalOpen,
    setIsImportModalOpen,
    userProfile,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    globalSearch,
    setGlobalSearch,
  } = useFinance();

  const [categoryFilter, setCategoryFilter] = useState<string>(
    selectedCategoryFilter || 'all'
  );
  const [typeFilter, setTypeFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Sync if category was selected from donut chart
  React.useEffect(() => {
    if (selectedCategoryFilter) {
      setCategoryFilter(selectedCategoryFilter);
    }
  }, [selectedCategoryFilter]);

  // Unique sources
  const sources = useMemo(() => {
    const list = new Set<string>();
    transactions.forEach((t) => {
      if (t.source) list.add(t.source);
    });
    return Array.from(list);
  }, [transactions]);

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Search query
        if (globalSearch.trim()) {
          const q = globalSearch.toLowerCase();
          const matchTitle = tx.title.toLowerCase().includes(q);
          const matchMerchant = tx.merchant.toLowerCase().includes(q);
          const matchUpi = tx.upiRef?.toLowerCase().includes(q);
          const matchCategory = tx.category.toLowerCase().includes(q);
          if (!matchTitle && !matchMerchant && !matchUpi && !matchCategory) {
            return false;
          }
        }

        // Category
        if (categoryFilter !== 'all' && tx.category !== categoryFilter) {
          return false;
        }

        // Type
        if (typeFilter !== 'all' && tx.type !== typeFilter) {
          return false;
        }

        // Source
        if (sourceFilter !== 'all' && tx.source !== sourceFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === 'date-asc') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortBy === 'amount-desc') {
          return b.amount - a.amount;
        }
        if (sortBy === 'amount-asc') {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [transactions, globalSearch, categoryFilter, typeFilter, sourceFilter, sortBy]);

  // Aggregates for current filter view
  const aggregates = useMemo(() => {
    let debits = 0;
    let credits = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'debit') debits += t.amount;
      if (t.type === 'credit') credits += t.amount;
    });
    return { debits, credits, count: filteredTransactions.length };
  }, [filteredTransactions]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Title', 'Merchant', 'Category', 'Type', 'Amount (INR)', 'Source', 'UPI Ref', 'Notes'];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.date,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.merchant.replace(/"/g, '""')}"`,
      t.category,
      t.type,
      t.amount,
      `"${t.source}"`,
      t.upiRef || '',
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SpendWise_Transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categoriesList: TransactionCategory[] = [
    'Salary',
    'Shopping',
    'Food',
    'Travel',
    'Bills',
    'Education',
    'Healthcare',
    'Entertainment',
    'Investment',
    'Debt EMI',
    'Other',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Primary Actions */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Transaction Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive history of UPI debits, bank transfers, investments, and credits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-all"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-all"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-slate-500" />
            <span>Import Statement</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddTxModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Filter by merchant, note, or UPI ref..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setSelectedCategoryFilter(null);
              }}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="all">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Type Dropdown */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="all">All Types (Debit & Credit)</option>
              <option value="debit">Debits Only</option>
              <option value="credit">Credits Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="date-desc">Date: Newest First</option>
              <option value="date-asc">Date: Oldest First</option>
              <option value="amount-desc">Amount: High to Low</option>
              <option value="amount-asc">Amount: Low to High</option>
            </select>
          </div>
        </div>

        {/* Aggregates Summary Strip */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-500 font-medium">
            <span>
              Showing <strong className="text-slate-900">{aggregates.count}</strong> transactions
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Inflow:{' '}
              <strong className="text-emerald-700 font-mono tabular-nums">
                +{formatCurrency(aggregates.credits, userProfile.currency)}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Outflow:{' '}
              <strong className="text-slate-900 font-mono tabular-nums">
                -{formatCurrency(aggregates.debits, userProfile.currency)}
              </strong>
            </span>
          </div>

          {(categoryFilter !== 'all' || typeFilter !== 'all' || sourceFilter !== 'all' || globalSearch) && (
            <button
              onClick={() => {
                setCategoryFilter('all');
                setTypeFilter('all');
                setSourceFilter('all');
                setGlobalSearch('');
                setSelectedCategoryFilter(null);
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900">No transactions found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Try adjusting your search criteria or resetting filters to see your complete financial ledger.
            </p>
            <button
              onClick={() => {
                setCategoryFilter('all');
                setTypeFilter('all');
                setGlobalSearch('');
              }}
              className="mt-4 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-4">Merchant & Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTransactions.map((tx) => {
                  const Icon = CATEGORY_ICONS[tx.category] || ShoppingBag;
                  const isCredit = tx.type === 'credit';

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-5 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                        {formatDate(tx.date)}
                      </td>

                      {/* Title & Merchant */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isCredit
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                              {tx.title}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {tx.merchant} {tx.upiRef && `· ${tx.upiRef}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-600 font-medium">
                          {tx.category}
                        </span>
                      </td>

                      {/* Payment Method / Source */}
                      <td className="py-3.5 px-4 hidden sm:table-cell">
                        <span className="text-slate-500 text-[11px]">
                          {tx.source}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold tabular-nums whitespace-nowrap">
                        <span
                          className={
                            isCredit
                              ? 'text-emerald-600 font-bold'
                              : 'text-slate-900'
                          }
                        >
                          {isCredit ? '+' : '-'}
                          {formatCurrency(tx.amount, userProfile.currency)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedTx(tx)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
                            aria-label="View transaction details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTransaction(tx.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            aria-label="Delete transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Drawer Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Transaction Details
              </h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Amount</span>
                <span
                  className={`text-lg font-bold font-mono tabular-nums ${
                    selectedTx.type === 'credit'
                      ? 'text-emerald-600'
                      : 'text-slate-900'
                  }`}
                >
                  {selectedTx.type === 'credit' ? '+' : '-'}
                  {formatCurrency(selectedTx.amount, userProfile.currency)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-t border-slate-100">
                <span className="text-slate-500">Merchant</span>
                <span className="font-semibold text-slate-900">
                  {selectedTx.merchant}
                </span>
              </div>

              <div className="flex justify-between py-1 border-t border-slate-100">
                <span className="text-slate-500">Category</span>
                <span className="font-semibold text-slate-900">
                  {selectedTx.category}
                </span>
              </div>

              <div className="flex justify-between py-1 border-t border-slate-100">
                <span className="text-slate-500">Payment Channel</span>
                <span className="font-semibold text-slate-900">
                  {selectedTx.source}
                </span>
              </div>

              <div className="flex justify-between py-1 border-t border-slate-100">
                <span className="text-slate-500">Date</span>
                <span className="font-mono text-slate-900">
                  {formatDate(selectedTx.date)}
                </span>
              </div>

              {selectedTx.upiRef && (
                <div className="flex justify-between py-1 border-t border-slate-100">
                  <span className="text-slate-500">UPI Reference / Ref ID</span>
                  <span className="font-mono text-slate-700 font-medium">
                    {selectedTx.upiRef}
                  </span>
                </div>
              )}

              {selectedTx.notes && (
                <div className="py-2 border-t border-slate-100">
                  <span className="text-slate-500 block mb-1">Notes</span>
                  <p className="text-slate-700 bg-slate-50 p-2 rounded-lg">
                    {selectedTx.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  deleteTransaction(selectedTx.id);
                  setSelectedTx(null);
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                Delete Record
              </button>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
