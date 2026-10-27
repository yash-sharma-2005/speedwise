import {
  Transaction,
  Budget,
  Investment,
  Loan,
  UserProfile,
  FinancialInsight,
  CashFlowMonth,
  CashFlowWeek,
} from '../types/finance';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const isBackendConfigured = (): boolean => {
  return typeof API_BASE_URL === 'string' && API_BASE_URL.trim().length > 0;
};

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    sessionStorage.setItem('spendwise_jwt_token', token);
  } else {
    sessionStorage.removeItem('spendwise_jwt_token');
  }
};

export const getAuthToken = (): string | null => {
  if (authToken) return authToken;
  return sessionStorage.getItem('spendwise_jwt_token');
};

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  if (!isBackendConfigured()) {
    throw new Error('Backend is not configured (VITE_API_BASE_URL missing). Operating in sample/dev mode.');
  }

  const { timeoutMs = 15000, ...fetchOptions } = options;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Fallback dev header if in development
  if (import.meta.env.DEV && !token) {
    headers['X-User-Id'] = 'dev-local-user-01';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${API_BASE_URL.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMsg = `API Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData?.error?.message) {
          errorMsg = errorData.error.message;
        }
      } catch {
        // Response was not JSON
      }
      throw new Error(errorMsg);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms: ${endpoint}`);
    }
    throw err;
  }
}

export const api = {
  // 1. Profile
  profile: {
    get: () => request<UserProfile>('/profile'),
    update: (profile: Partial<UserProfile>) =>
      request<UserProfile>('/profile', {
        method: 'PUT',
        body: JSON.stringify(profile),
      }),
  },

  // 2. Transactions
  transactions: {
    list: (params?: {
      startDate?: string;
      endDate?: string;
      category?: string;
      type?: string;
      limit?: number;
      nextToken?: string;
    }) => {
      const q = new URLSearchParams();
      if (params?.startDate) q.append('startDate', params.startDate);
      if (params?.endDate) q.append('endDate', params.endDate);
      if (params?.category) q.append('category', params.category);
      if (params?.type) q.append('type', params.type);
      if (params?.limit) q.append('limit', params.limit.toString());
      if (params?.nextToken) q.append('nextToken', params.nextToken);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      return request<{ items: Transaction[]; nextToken?: string }>(`/transactions${queryStr}`);
    },
    get: (id: string) => request<Transaction>(`/transactions/${id}`),
    create: (tx: Omit<Transaction, 'id'>) =>
      request<Transaction>('/transactions', {
        method: 'POST',
        body: JSON.stringify(tx),
      }),
    update: (id: string, tx: Partial<Transaction>) =>
      request<Transaction>(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(tx),
      }),
    delete: (id: string) =>
      request<{ success: boolean; deletedTransactionId: string }>(`/transactions/${id}`, {
        method: 'DELETE',
      }),
    batch: (transactions: Omit<Transaction, 'id'>[]) =>
      request<{
        acceptedCount: number;
        rejectedCount: number;
        duplicateCount: number;
        accepted: Transaction[];
      }>('/transactions/batch', {
        method: 'POST',
        body: JSON.stringify({ transactions }),
      }),
    analyse: (data: {
      title: string;
      merchant?: string;
      type?: string;
      amount?: number;
      source?: string;
      notes?: string;
    }) =>
      request<{
        suggestedCategory: string;
        suggestedTransactionType: string;
        confidence: number;
        reason: string;
        needsReview: boolean;
      }>('/transactions/analyse', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    categorise: (id: string, category: string, saveMerchantRule = false) =>
      request<Transaction>(`/transactions/${id}/categorise`, {
        method: 'POST',
        body: JSON.stringify({ category, saveMerchantRule }),
      }),
  },

  // 3. Budgets
  budgets: {
    list: () => request<Budget[]>('/budgets'),
    create: (budget: Omit<Budget, 'id'>) =>
      request<Budget>('/budgets', {
        method: 'POST',
        body: JSON.stringify(budget),
      }),
    update: (id: string, budget: Partial<Budget>) =>
      request<Budget>(`/budgets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(budget),
      }),
    delete: (id: string) =>
      request<{ success: boolean; deletedBudgetId: string }>(`/budgets/${id}`, {
        method: 'DELETE',
      }),
    summary: (period?: string) => {
      const q = period ? `?period=${encodeURIComponent(period)}` : '';
      return request<{
        period: string;
        totalBudgeted: number;
        totalSpent: number;
        budgets: Budget[];
      }>(`/budgets/summary${q}`);
    },
  },

  // 4. Investments
  investments: {
    list: () => request<Investment[]>('/investments'),
    create: (investment: Omit<Investment, 'id'>) =>
      request<Investment>('/investments', {
        method: 'POST',
        body: JSON.stringify(investment),
      }),
    update: (id: string, investment: Partial<Investment>) =>
      request<Investment>(`/investments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(investment),
      }),
    delete: (id: string) =>
      request<{ success: boolean; deletedInvestmentId: string }>(`/investments/${id}`, {
        method: 'DELETE',
      }),
  },

  // 5. Loans
  loans: {
    list: () => request<Loan[]>('/loans'),
    create: (loan: Omit<Loan, 'id'>) =>
      request<Loan>('/loans', {
        method: 'POST',
        body: JSON.stringify(loan),
      }),
    update: (id: string, loan: Partial<Loan>) =>
      request<Loan>(`/loans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(loan),
      }),
    delete: (id: string) =>
      request<{ success: boolean; deletedLoanId: string }>(`/loans/${id}`, {
        method: 'DELETE',
      }),
    listRepayments: (loanId: string) => request<any[]>(`/loans/${loanId}/repayments`),
    createRepayment: (loanId: string, repayment: any) =>
      request<any>(`/loans/${loanId}/repayments`, {
        method: 'POST',
        body: JSON.stringify(repayment),
      }),
  },

  // 6. Dashboard & Analytics
  dashboard: {
    getSummary: () =>
      request<{
        totalIncome: number;
        totalExpenses: number;
        totalInvestments: number;
        outstandingDebt: number;
        availableBalance: number;
        monthlySavingsRate: number;
        investmentContributions: number;
        loanRepayments: number;
      }>('/dashboard/summary'),
  },

  analytics: {
    getCashflow: () =>
      request<{
        monthly: CashFlowMonth[];
        weekly: CashFlowWeek[];
      }>('/analytics/cashflow'),
    getCategories: () =>
      request<{
        totalSpend: number;
        categories: { category: string; amount: number; percentage: number }[];
      }>('/analytics/categories'),
    getPaymentSources: () =>
      request<{ source: string; count: number; amount: number }[]>('/analytics/payment-sources'),
    getInvestments: () =>
      request<{
        totalPortfolioValue: number;
        allocation: { type: string; amount: number; percentage: number }[];
      }>('/analytics/investments'),
    getDebt: () =>
      request<{
        totalOutstandingDebt: number;
        totalMonthlyObligation: number;
        loans: any[];
      }>('/analytics/debt'),
  },

  // 7. Insights
  insights: {
    list: () => request<FinancialInsight[]>('/insights'),
  },

  // 8. Statement Imports & Uploads
  imports: {
    create: (fileName: string, fileType = 'csv', source = 'Bank Statement') =>
      request<{
        importBatchId: string;
        uploadUrl: string;
        fileKey: string;
        status: string;
      }>('/imports', {
        method: 'POST',
        body: JSON.stringify({ fileName, fileType, source }),
      }),
    getStatus: (importBatchId: string) => request<any>(`/imports/${importBatchId}`),
    confirm: (importBatchId: string, transactions: Omit<Transaction, 'id'>[]) =>
      request<{ success: boolean; committedCount: number; status: string }>(
        `/imports/${importBatchId}/confirm`,
        {
          method: 'POST',
          body: JSON.stringify({ transactions }),
        }
      ),
    cancel: (importBatchId: string) =>
      request<{ success: boolean }>(`/imports/${importBatchId}`, {
        method: 'DELETE',
      }),
  },

  uploads: {
    getPresignedUrl: (data: {
      fileName: string;
      fileType: 'statement' | 'receipt' | 'report';
      contentType: string;
      fileSize: number;
      associatedTransactionId?: string;
    }) =>
      request<{
        fileId: string;
        uploadUrl: string;
        expiresInSeconds: number;
      }>('/uploads/presigned-url', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getDownloadUrl: (fileId: string) =>
      request<{
        fileId: string;
        downloadUrl: string;
        expiresInSeconds: number;
        fileName: string;
      }>(`/uploads/${fileId}/download-url`),
    delete: (fileId: string) => request<{ success: boolean }>(`/uploads/${fileId}`, { method: 'DELETE' }),
  },
};
