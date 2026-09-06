import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowUpRight, ArrowDownRight, Wallet, PiggyBank, FileText, BellRing, Sparkles } from 'lucide-react';
import { formatCurrency, getMonthlySpendingReport } from '../utils/finance';

export default function Dashboard({ user }) {
  const userKey = user?._id || user?.id || user?.email || 'guest';
  const storageKey = `wp_transactions_${userKey}`;

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Extract financial profile directly from backend user object or local state
  const financialProfile = user?.financialProfile || {};
  
  const contactInfo = financialProfile.contactDetails || financialProfile.contact || 'Not set';
  const goalsInfo = financialProfile.financialGoals || financialProfile.goals || 'Not set';
  const activityInfo = financialProfile.financialActivityHistory || financialProfile.activity || 'Not set';

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/transactions', {
        withCredentials: true
      });

      const data = Array.isArray(response.data) ? response.data : [];
      setTransactions(data);
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (err) {
      if (err?.response?.status === 401) {
        setTransactions([]);
        localStorage.removeItem(storageKey);
      } else {
        const saved = localStorage.getItem(storageKey);
        try {
          setTransactions(saved ? JSON.parse(saved) : []);
        } catch (e) {
          setTransactions([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    fetchTransactions();
  }, [userKey, user]);

  const totalInflow = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const totalOutflow = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const allocatedToGoals = transactions
    .filter((t) => t.category === 'Savings' || t.category === 'Goals')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const availableCash = totalInflow - totalOutflow;
  const netBalance = availableCash + allocatedToGoals;
  const report = getMonthlySpendingReport(transactions, new Date());

  return (
    <div className="space-y-8">
      <div className="premium-card card-hover border border-emerald-500/20 bg-gradient-to-br from-slate-900/60 via-slate-900/50 to-emerald-950/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-7">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs uppercase tracking-[0.2em] font-semibold">
              <Sparkles className="w-4 h-4 animate-pulse" />
              Welcome back
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              {user?.name || 'WealthPulse User'}
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl leading-relaxed">
              {goalsInfo !== 'Not set' ? goalsInfo : 'Track your habits, portfolio, and monthly cash flow to stay aligned with your financial goals.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => window.location.href = '/reports'}
              className="group flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 active:scale-95"
            >
              <FileText className="w-5 h-5" />
              <span>Generate Reports</span>
            </button>
            <button
              onClick={() => window.location.href = '/habits'}
              className="group flex items-center justify-center gap-2 border border-slate-600 bg-slate-800/60 hover:bg-slate-700 text-white font-bold px-5 py-3 rounded-xl transition-all hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-400/10 hover:-translate-y-1 active:scale-95"
            >
              <BellRing className="w-5 h-5 text-amber-400" />
              <span>Reminders</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h2>
        <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" />
        <p className="text-slate-400 text-sm">
          Monitor your total net worth, liquid available cash, and goal allocations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="metric-card premium-card card-hover group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Net Balance</span>
              <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-400 rounded-xl group-hover:from-emerald-500/30 transition-all">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400 stat-value">{formatCurrency(netBalance)}</div>
              <div className="h-1 bg-gradient-to-r from-emerald-500/40 to-transparent rounded-full mt-4 group-hover:from-emerald-400/60 transition-all" />
            </div>
          </div>
        </div>

        <div className="metric-card premium-card card-hover group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Available Cash</span>
              <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 text-cyan-400 rounded-xl group-hover:from-cyan-500/30 transition-all">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-400 stat-value">{formatCurrency(availableCash)}</div>
              <div className="h-1 bg-gradient-to-r from-cyan-500/40 to-transparent rounded-full mt-4 group-hover:from-cyan-400/60 transition-all" />
            </div>
          </div>
        </div>

        <div className="metric-card premium-card card-hover group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Allocated to Goals</span>
              <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 text-indigo-400 rounded-xl group-hover:from-indigo-500/30 transition-all">
                <PiggyBank className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-indigo-300 stat-value">{formatCurrency(allocatedToGoals)}</div>
              <div className="h-1 bg-gradient-to-r from-indigo-500/40 to-transparent rounded-full mt-4 group-hover:from-indigo-400/60 transition-all" />
            </div>
          </div>
        </div>

        <div className="metric-card premium-card card-hover group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Total Outflow</span>
              <div className="p-3 bg-gradient-to-br from-rose-500/20 to-rose-500/5 text-rose-400 rounded-xl group-hover:from-rose-500/30 transition-all">
                <ArrowDownRight className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-rose-400 stat-value">{formatCurrency(totalOutflow)}</div>
              <div className="h-1 bg-gradient-to-r from-rose-500/40 to-transparent rounded-full mt-4 group-hover:from-rose-400/60 transition-all" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="premium-card card-hover">
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
            Monthly Snapshot
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="group bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/30 rounded-xl p-4 hover:border-emerald-400/50 transition-all">
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Income</div>
              <div className="text-emerald-400 font-bold mt-2 text-lg stat-value">{formatCurrency(report.income)}</div>
            </div>
            <div className="group bg-gradient-to-br from-rose-500/15 to-rose-500/5 border border-rose-500/30 rounded-xl p-4 hover:border-rose-400/50 transition-all">
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Expenses</div>
              <div className="text-rose-400 font-bold mt-2 text-lg stat-value">{formatCurrency(report.expenses)}</div>
            </div>
            <div className="group col-span-2 bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 border border-cyan-500/30 rounded-xl p-4 hover:border-cyan-400/50 transition-all">
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Top Category</div>
              <div className="text-white font-bold mt-2">{report.topCategoryName}</div>
              <div className="text-cyan-400 mt-1 text-lg stat-value">{formatCurrency(report.topCategoryValue)}</div>
            </div>
          </div>
        </div>

        <div className="premium-card card-hover">
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-400 to-pink-400" />
            Profile Summary
          </h2>
          <div className="space-y-4 text-sm text-slate-300">
            <div className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-700/40 rounded-lg hover:border-slate-600/60 transition-all">
              <span className="text-slate-400 font-medium">Name</span>
              <span className="text-white font-semibold">{user?.name || 'Not set'}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-700/40 rounded-lg hover:border-slate-600/60 transition-all">
              <span className="text-slate-400 font-medium">Contact</span>
              <span className="text-white font-semibold">{contactInfo}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-700/40 rounded-lg hover:border-slate-600/60 transition-all">
              <span className="text-slate-400 font-medium">Goals</span>
              <span className="text-white font-semibold">{goalsInfo}</span>
            </div>
            <div className="p-3 bg-slate-800/40 border border-slate-700/40 rounded-lg hover:border-slate-600/60 transition-all">
              <span className="text-slate-400 font-medium text-xs uppercase tracking-wider block mb-2">Activity</span>
              <span className="text-slate-200 text-xs leading-relaxed block">
                {activityInfo !== 'Not set'
                  ? activityInfo.slice(0, 100) + (activityInfo.length > 100 ? '...' : '')
                  : 'Not set'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="premium-card card-hover">
        <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400" />
          Recent Activity &amp; Goal Deposits
        </h2>

        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-400 border-t-transparent" />
            <div className="mt-3">Loading transactions...</div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-gradient-to-b from-slate-800/40 to-slate-900/20 rounded-xl border border-slate-700/50">
            <div className="text-3xl mb-2">📋</div>
            <p>No transactions recorded yet for this user.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 5).map((item) => (
              <div
                key={item._id || item.id}
                className="category-row flex items-center justify-between p-4 bg-slate-800/40 border border-slate-700/40 rounded-lg group hover:border-slate-600/60 transition-all"
              >
                <div className="flex-1">
                  <div className="font-semibold text-white group-hover:text-emerald-300 transition-colors">{item.description}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-500">{item.date}</span>
                    <span className="text-xs bg-slate-700/50 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-600/40 group-hover:bg-emerald-500/15 group-hover:text-emerald-300 transition-all">
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className={`font-bold text-lg ${
                  item.type === 'income' ? 'text-emerald-400' : 'text-slate-300'
                } stat-value`}>
                  {item.type === 'income' ? `+ ₹${item.amount}` : `- ₹${item.amount}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}