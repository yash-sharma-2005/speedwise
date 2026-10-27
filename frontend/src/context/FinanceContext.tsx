import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Transaction,
  Budget,
  Investment,
  Loan,
  UserProfile,
  FinancialInsight,
  TransactionCategory,
} from '../types/finance';
import {
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_INVESTMENTS,
  INITIAL_LOANS,
  INITIAL_USER_PROFILE,
  INITIAL_INSIGHTS,
} from '../data/mockData';
import { api, isBackendConfigured } from '../services/api';

export type AppSection =
  | 'overview'
  | 'transactions'
  | 'smart-tracker'
  | 'investments'
  | 'loans'
  | 'budgets'
  | 'analytics'
  | 'settings';

interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  totalInvestments: number;
  outstandingDebt: number;
  availableBalance: number;
  monthlySavingsRate: number;
}

interface FinanceContextType {
  currentSection: AppSection;
  setCurrentSection: (section: AppSection) => void;
  selectedCategoryFilter: string | null;
  setSelectedCategoryFilter: (category: string | null) => void;
  transactions: Transaction[];
  budgets: Budget[];
  investments: Investment[];
  loans: Loan[];
  userProfile: UserProfile;
  insights: FinancialInsight[];
  summary: FinanceSummary;
  dateRange: string;
  setDateRange: (range: string) => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  isAddTxModalOpen: boolean;
  setIsAddTxModalOpen: (open: boolean) => void;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (open: boolean) => void;

  // Backend Integration Status
  isBackendMode: boolean;
  isLoadingBackend: boolean;
  backendError: string | null;
  refreshBackendData: () => Promise<void>;

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void> | void;
  updateTransaction: (id: string, updated: Partial<Transaction>) => Promise<void> | void;
  deleteTransaction: (id: string) => Promise<void> | void;
  importTransactionsBatch: (newTxs: Omit<Transaction, 'id'>[]) => Promise<void> | void;
  addBudget: (budget: Omit<Budget, 'id'>) => Promise<void> | void;
  updateBudget: (id: string, updated: Partial<Budget>) => Promise<void> | void;
  addInvestment: (investment: Omit<Investment, 'id'>) => Promise<void> | void;
  updateLoan: (id: string, updated: Partial<Loan>) => Promise<void> | void;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void> | void;
  resetToSampleData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TRANSACTIONS: 'spendwise_transactions_v1',
  BUDGETS: 'spendwise_budgets_v1',
  INVESTMENTS: 'spendwise_investments_v1',
  LOANS: 'spendwise_loans_v1',
  PROFILE: 'spendwise_profile_v1',
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSection, setCurrentSection] = useState<AppSection>('overview');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string>('October 2026');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Backend state
  const isBackend = isBackendConfigured();
  const [isLoadingBackend, setIsLoadingBackend] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [backendSummary, setBackendSummary] = useState<FinanceSummary | null>(null);
  const [backendInsights, setBackendInsights] = useState<FinancialInsight[] | null>(null);

  // Core Data
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
    } catch {
      return INITIAL_BUDGETS;
    }
  });

  const [investments, setInvestments] = useState<Investment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVESTMENTS);
      return saved ? JSON.parse(saved) : INITIAL_INVESTMENTS;
    } catch {
      return INITIAL_INVESTMENTS;
    }
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOANS);
      return saved ? JSON.parse(saved) : INITIAL_LOANS;
    } catch {
      return INITIAL_LOANS;
    }
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE;
    } catch {
      return INITIAL_USER_PROFILE;
    }
  });

  // Sync to LocalStorage (only in offline/development mode)
  useEffect(() => {
    if (!isBackend) {
      try {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      } catch (e) {
        console.warn('Storage sync error', e);
      }
    }
  }, [transactions, isBackend]);

  useEffect(() => {
    if (!isBackend) {
      try {
        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
      } catch (e) {
        console.warn('Storage sync error', e);
      }
    }
  }, [budgets, isBackend]);

  useEffect(() => {
    if (!isBackend) {
      try {
        localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(investments));
      } catch (e) {
        console.warn('Storage sync error', e);
      }
    }
  }, [investments, isBackend]);

  useEffect(() => {
    if (!isBackend) {
      try {
        localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
      } catch (e) {
        console.warn('Storage sync error', e);
      }
    }
  }, [loans, isBackend]);

  useEffect(() => {
    if (!isBackend) {
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(userProfile));
      } catch (e) {
        console.warn('Storage sync error', e);
      }
    }
  }, [userProfile, isBackend]);

  // Fetch initial data from backend if configured
  const loadBackendData = useCallback(async () => {
    if (!isBackend) return;
    setIsLoadingBackend(true);
    setBackendError(null);
    try {
      const [txRes, bgtRes, invRes, loanRes, profRes, sumRes, insRes] = await Promise.allSettled([
        api.transactions.list({ limit: 100 }),
        api.budgets.list(),
        api.investments.list(),
        api.loans.list(),
        api.profile.get(),
        api.dashboard.getSummary(),
        api.insights.list(),
      ]);

      if (txRes.status === 'fulfilled' && txRes.value.items) {
        setTransactions(
          txRes.value.items.map((t: any) => ({
            ...t,
            id: t.transactionId || t.id,
          }))
        );
      }
      if (bgtRes.status === 'fulfilled' && Array.isArray(bgtRes.value)) {
        setBudgets(bgtRes.value.map((b: any) => ({ ...b, id: b.budgetId || b.id })));
      }
      if (invRes.status === 'fulfilled' && Array.isArray(invRes.value)) {
        setInvestments(invRes.value.map((i: any) => ({ ...i, id: i.investmentId || i.id })));
      }
      if (loanRes.status === 'fulfilled' && Array.isArray(loanRes.value)) {
        setLoans(loanRes.value.map((l: any) => ({ ...l, id: l.loanId || l.id })));
      }
      if (profRes.status === 'fulfilled') {
        setUserProfile(profRes.value);
      }
      if (sumRes.status === 'fulfilled') {
        setBackendSummary(sumRes.value);
      }
      if (insRes.status === 'fulfilled') {
        setBackendInsights(insRes.value);
      }
    } catch (err: any) {
      console.error('Failed to load authoritative backend data:', err);
      setBackendError(err.message || 'Error connecting to AWS backend');
    } finally {
      setIsLoadingBackend(false);
    }
  }, [isBackend]);

  useEffect(() => {
    if (isBackend) {
      loadBackendData();
    }
  }, [isBackend, loadBackendData]);

  // Derived Financial Summary calculation
  const calculateSummary = (): FinanceSummary => {
    if (backendSummary) {
      return backendSummary;
    }

    const expenseCategories: TransactionCategory[] = [
      'Shopping',
      'Food',
      'Travel',
      'Bills',
      'Education',
      'Healthcare',
      'Entertainment',
      'Other',
    ];

    const totalIncome = transactions
      .filter((t) => t.type === 'credit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(
        (t) =>
          t.type === 'debit' &&
          t.status === 'completed' &&
          expenseCategories.includes(t.category)
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const totalInvestments = investments.reduce(
      (sum, inv) => sum + inv.currentValue,
      0
    );

    const outstandingDebt = loans.reduce((sum, l) => sum + l.outstanding, 0);
    const baseBankBalance = 42350;
    const availableBalance = Math.max(0, baseBankBalance);
    const monthlySavingsRate = 29;

    return {
      totalIncome: totalIncome > 0 ? totalIncome : 85000,
      totalExpenses: totalExpenses > 0 ? totalExpenses : 24650,
      totalInvestments: totalInvestments > 0 ? totalInvestments : 145000,
      outstandingDebt: outstandingDebt > 0 ? outstandingDebt : 280000,
      availableBalance,
      monthlySavingsRate,
    };
  };

  const summary = calculateSummary();

  const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
    if (isBackend) {
      try {
        const created = await api.transactions.create(tx);
        const mappedTx: Transaction = {
          ...created,
          id: (created as any).transactionId || created.id,
        };
        setTransactions((prev) => [mappedTx, ...prev]);

        if (tx.type === 'debit') {
          setBudgets((prev) =>
            prev.map((b) =>
              b.category === tx.category ? { ...b, spent: b.spent + tx.amount } : b
            )
          );
        }
        return;
      } catch (err) {
        console.error('Backend addTransaction error:', err);
      }
    }

    // Local / Offline fallback
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`,
    };
    setTransactions((prev) => [newTx, ...prev]);

    if (tx.type === 'debit') {
      setBudgets((prev) =>
        prev.map((b) =>
          b.category === tx.category ? { ...b, spent: b.spent + tx.amount } : b
        )
      );
    }
  };

  const updateTransaction = async (id: string, updated: Partial<Transaction>) => {
    if (isBackend) {
      try {
        const res = await api.transactions.update(id, updated);
        const mappedTx = { ...res, id: (res as any).transactionId || res.id };
        setTransactions((prev) => prev.map((t) => (t.id === id ? mappedTx : t)));
        return;
      } catch (err) {
        console.error('Backend updateTransaction error:', err);
      }
    }

    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
    );
  };

  const deleteTransaction = async (id: string) => {
    if (isBackend) {
      try {
        await api.transactions.delete(id);
      } catch (err) {
        console.error('Backend deleteTransaction error:', err);
      }
    }

    const target = transactions.find((t) => t.id === id);
    if (target && target.type === 'debit') {
      setBudgets((prev) =>
        prev.map((b) =>
          b.category === target.category
            ? { ...b, spent: Math.max(0, b.spent - target.amount) }
            : b
        )
      );
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const importTransactionsBatch = async (newTxs: Omit<Transaction, 'id'>[]) => {
    if (isBackend) {
      try {
        const batchRes = await api.transactions.batch(newTxs);
        if (batchRes.accepted && batchRes.accepted.length > 0) {
          const mapped = batchRes.accepted.map((t: any) => ({
            ...t,
            id: t.transactionId || t.id,
          }));
          setTransactions((prev) => [...mapped, ...prev]);
          return;
        }
      } catch (err) {
        console.error('Backend batch import error:', err);
      }
    }

    const prepared: Transaction[] = newTxs.map((t, idx) => ({
      ...t,
      id: `imported-${Date.now()}-${idx}`,
    }));
    setTransactions((prev) => [...prepared, ...prev]);
  };

  const addBudget = async (budget: Omit<Budget, 'id'>) => {
    if (isBackend) {
      try {
        const created = await api.budgets.create(budget);
        const mapped = { ...created, id: (created as any).budgetId || created.id };
        setBudgets((prev) => [...prev, mapped]);
        return;
      } catch (err) {
        console.error('Backend addBudget error:', err);
      }
    }

    const newBudget: Budget = {
      ...budget,
      id: `bgt-${Date.now()}`,
    };
    setBudgets((prev) => [...prev, newBudget]);
  };

  const updateBudget = async (id: string, updated: Partial<Budget>) => {
    if (isBackend) {
      try {
        const res = await api.budgets.update(id, updated);
        const mapped = { ...res, id: (res as any).budgetId || res.id };
        setBudgets((prev) => prev.map((b) => (b.id === id ? mapped : b)));
        return;
      } catch (err) {
        console.error('Backend updateBudget error:', err);
      }
    }

    setBudgets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updated } : b))
    );
  };

  const addInvestment = async (investment: Omit<Investment, 'id'>) => {
    if (isBackend) {
      try {
        const created = await api.investments.create(investment);
        const mapped = { ...created, id: (created as any).investmentId || created.id };
        setInvestments((prev) => [...prev, mapped]);
        return;
      } catch (err) {
        console.error('Backend addInvestment error:', err);
      }
    }

    const newInv: Investment = {
      ...investment,
      id: `inv-${Date.now()}`,
    };
    setInvestments((prev) => [...prev, newInv]);
  };

  const updateLoan = async (id: string, updated: Partial<Loan>) => {
    if (isBackend) {
      try {
        const res = await api.loans.update(id, updated);
        const mapped = { ...res, id: (res as any).loanId || res.id };
        setLoans((prev) => prev.map((l) => (l.id === id ? mapped : l)));
        return;
      } catch (err) {
        console.error('Backend updateLoan error:', err);
      }
    }

    setLoans((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updated } : l))
    );
  };

  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    if (isBackend) {
      try {
        const updated = await api.profile.update(profile);
        setUserProfile(updated);
        return;
      } catch (err) {
        console.error('Backend updateUserProfile error:', err);
      }
    }

    setUserProfile((prev) => ({ ...prev, ...profile }));
  };

  const resetToSampleData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setBudgets(INITIAL_BUDGETS);
    setInvestments(INITIAL_INVESTMENTS);
    setLoans(INITIAL_LOANS);
    setUserProfile(INITIAL_USER_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.BUDGETS);
    localStorage.removeItem(STORAGE_KEYS.INVESTMENTS);
    localStorage.removeItem(STORAGE_KEYS.LOANS);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
  };

  return (
    <FinanceContext.Provider
      value={{
        currentSection,
        setCurrentSection,
        selectedCategoryFilter,
        setSelectedCategoryFilter,
        transactions,
        budgets,
        investments,
        loans,
        userProfile,
        insights: backendInsights || INITIAL_INSIGHTS,
        summary,
        dateRange,
        setDateRange,
        globalSearch,
        setGlobalSearch,
        isAddTxModalOpen,
        setIsAddTxModalOpen,
        isImportModalOpen,
        setIsImportModalOpen,
        isBackendMode: isBackend,
        isLoadingBackend,
        backendError,
        refreshBackendData: loadBackendData,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        importTransactionsBatch,
        addBudget,
        updateBudget,
        addInvestment,
        updateLoan,
        updateUserProfile,
        resetToSampleData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
