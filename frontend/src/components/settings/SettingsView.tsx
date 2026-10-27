import React, { useState } from 'react';
import {
  User,
  CreditCard,
  Bell,
  RotateCcw,
  Check,
  Building2,
  Smartphone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const SettingsView: React.FC = () => {
  const { userProfile, updateUserProfile, resetToSampleData } = useFinance();

  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [phone, setPhone] = useState(userProfile.phone);
  const [role, setRole] = useState(userProfile.role);
  const [currency, setCurrency] = useState(userProfile.currency);
  const [targetSavings, setTargetSavings] = useState(userProfile.monthlySavingsTarget);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name,
      email,
      phone,
      role,
      currency,
      monthlySavingsTarget: targetSavings,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Are you sure you want to restore the default sample dataset for October 2026? Any newly added transactions will be reset.'
      )
    ) {
      resetToSampleData();
      alert('Sample dataset restored successfully.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Account & Financial Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal profile, preferred currencies, linked account aliases, and data preferences.
        </p>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Personal Information</h2>
              <p className="text-xs text-slate-500">
                Details used for statements, salary matching, and export reports
              </p>
            </div>
          </div>

          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Saved successfully</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="mt-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Primary Phone / UPI Mobile
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Occupation / Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Base Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
              >
                <option value="INR">₹ Indian Rupee (INR)</option>
                <option value="USD">$ US Dollar (USD)</option>
                <option value="EUR">€ Euro (EUR)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Monthly Savings Target (%)
              </label>
              <input
                type="number"
                min="5"
                max="80"
                value={targetSavings}
                onChange={(e) => setTargetSavings(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs transition-colors"
            >
              Update Preferences
            </button>
          </div>
        </form>
      </div>

      {/* Linked Financial Accounts Section */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs">
        <div className="pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">
            Connected Accounts & UPI IDs
          </h2>
          <p className="text-xs text-slate-500">
            Virtual financial sources tracked within your local ledger
          </p>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-900">
                  ICICI Bank Salary Account
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  A/c No: •••• 8910 · Auto Salary Inflow
                </div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded">
              Primary
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-900">
                  HDFC Bank Savings & Millennia Card
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  A/c No: •••• 4421 · Daily Expenses & SIPs
                </div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
              Active
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-900">
                  UPI VPA: alex.verma@okaxis (Google Pay)
                </div>
                <div className="text-[11px] text-slate-500">
                  Linked to HDFC Bank · Merchant AutoPay Active
                </div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Data Management & Sample Reset */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs">
        <div className="pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">
            Data Storage & Sample Dataset
          </h2>
          <p className="text-xs text-slate-500">
            SpendWise runs securely entirely within your browser utilizing localStorage.
          </p>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              Restore Sample October 2026 Dataset
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Reset all transactions, budgets, investments, and loan models back to the initial reference state.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetData}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shadow-2xs transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Sample Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
