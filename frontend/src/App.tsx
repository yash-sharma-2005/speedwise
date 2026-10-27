import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { OverviewView } from './components/overview/OverviewView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { SmartTrackerView } from './components/smart-tracker/SmartTrackerView';
import { InvestmentsView } from './components/investments/InvestmentsView';
import { LoansView } from './components/loans/LoansView';
import { BudgetsView } from './components/budgets/BudgetsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SettingsView } from './components/settings/SettingsView';
import { AddTransactionModal } from './components/transactions/AddTransactionModal';
import { ImportStatementModal } from './components/transactions/ImportStatementModal';

const AppContent: React.FC = () => {
  const { currentSection } = useFinance();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderActiveSection = () => {
    switch (currentSection) {
      case 'overview':
        return <OverviewView />;
      case 'transactions':
        return <TransactionsView />;
      case 'smart-tracker':
        return <SmartTrackerView />;
      case 'investments':
        return <InvestmentsView />;
      case 'loans':
        return <LoansView />;
      case 'budgets':
        return <BudgetsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      {/* Left Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0 min-h-screen">
        <TopNavbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveSection()}
        </main>
      </div>

      {/* Global Modals */}
      <AddTransactionModal />
      <ImportStatementModal />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
