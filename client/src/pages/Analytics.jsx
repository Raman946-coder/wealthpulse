import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Percent, PieChart, HelpCircle } from 'lucide-react';
import API_URL from '../utils/api';

export default function Analytics({ user }) {
  const userKey = user?._id || user?.id || user?.email || 'guest';
  const storageKey = `wp_transactions_${userKey}`;

  const [transactions, setTransactions] = useState([]);
  const [viewMode, setViewMode] = useState('outflow'); // 'outflow' | 'income'

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/transactions`, {
          withCredentials: true
        });
        const data = Array.isArray(response.data) ? response.data : [];
        setTransactions(data);
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (error) {
        try {
          const savedTx = localStorage.getItem(storageKey);
          if (savedTx) {
            setTransactions(JSON.parse(savedTx));
          } else {
            setTransactions([]);
          }
        } catch (e) {
          setTransactions([]);
        }
      }
    };

    if (user) {
      loadTransactions();
    } else {
      setTransactions([]);
    }
  }, [storageKey, user]);

  const safeTx = Array.isArray(transactions) ? transactions : [];

  const totalIncome = safeTx
    .filter((t) => t && t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpenses = safeTx
    .filter((t) => t && t.type === 'expense' && t.category !== 'Savings')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalSavingsDeposits = safeTx
    .filter((t) => t && t.type === 'expense' && t.category === 'Savings')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalOutflow = totalExpenses + totalSavingsDeposits;
  const netRetained = totalIncome - totalOutflow;

  // Savings rate calculation
  const savingsRate = totalIncome > 0 ? Math.round((totalSavingsDeposits / totalIncome) * 100) : 0;
  const trueSavingsRate = totalIncome > 0 ? ((netRetained + totalSavingsDeposits) / totalIncome) * 100 : 0;

  // Category Aggregations
  const categoryMap = safeTx
    .filter((t) => t && t.type === 'expense')
    .reduce((acc, t) => {
      const cat = t.category || 'Other';
      acc[cat] = (acc[cat] || 0) + (Number(t.amount) || 0);
      return acc;
    }, {});

  const categoryList = Object.keys(categoryMap)
    .map((cat) => {
      const amount = categoryMap[cat];
      const percentOutflowRaw = totalOutflow > 0 ? (amount / totalOutflow) * 100 : 0;
      const percentIncomeRaw = totalIncome > 0 ? (amount / totalIncome) * 100 : 0;
      
      return {
        name: cat,
        amount,
        percentOutflowDisplay: Math.round(percentOutflowRaw),
        percentOutflowExact: percentOutflowRaw.toFixed(2),
        percentIncomeDisplay: Math.round(percentIncomeRaw),
        percentIncomeExact: percentIncomeRaw.toFixed(2),
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-8 text-white max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">Financial Analytics</h1>
        <p className="text-slate-400 text-sm">
          Gain insights into your spending behavior, goal contributions, and overall financial health.
        </p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 auto-rows-max">
        <div className="metric-card premium-card card-hover group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Total Income</span>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-400 flex items-center justify-center font-bold group-hover:from-emerald-500/30 transition-all">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-bold text-emerald-400 stat-value">₹{totalIncome.toLocaleString()}</span>
              <div className="h-1 bg-gradient-to-r from-emerald-500/40 to-transparent rounded-full mt-3 group-hover:from-emerald-400/60 transition-all" />
            </div>
          </div>
        </div>

        <div className="metric-card premium-card card-hover group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">General Expenses</span>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-500/5 text-rose-400 flex items-center justify-center font-bold group-hover:from-rose-500/30 transition-all">
                <ArrowDownRight className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-bold text-rose-400 stat-value">₹{totalExpenses.toLocaleString()}</span>
              <div className="h-1 bg-gradient-to-r from-rose-500/40 to-transparent rounded-full mt-3 group-hover:from-rose-400/60 transition-all" />
            </div>
          </div>
        </div>

        <div className="metric-card premium-card card-hover group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Goal Savings Outflow</span>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 text-indigo-400 flex items-center justify-center font-bold group-hover:from-indigo-500/30 transition-all">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-bold text-indigo-300 stat-value">₹{totalSavingsDeposits.toLocaleString()}</span>
              <div className="h-1 bg-gradient-to-r from-indigo-500/40 to-transparent rounded-full mt-3 group-hover:from-indigo-400/60 transition-all" />
            </div>
          </div>
        </div>

        <div className="metric-card premium-card card-hover group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Savings Rate</span>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 text-cyan-400 flex items-center justify-center font-bold group-hover:from-cyan-500/30 transition-all">
                <Percent className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-cyan-400 stat-value">{savingsRate}%</span>
              <span className="text-xs text-slate-400">Deposited</span>
            </div>
            <div className="h-1 bg-gradient-to-r from-cyan-500/40 to-transparent rounded-full group-hover:from-cyan-400/60 transition-all" />
          </div>
          {/* Tooltip for True Savings Rate */}
          <div className="absolute left-1/2 -bottom-14 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 border border-slate-700 text-xs text-slate-200 px-4 py-2 rounded-lg shadow-2xl pointer-events-none z-20 whitespace-nowrap backdrop-blur-sm">
            <div className="font-bold text-cyan-400">True Savings Rate</div>
            <div className="text-slate-300 text-[11px]">(inc. retained wealth): <span className="font-bold text-emerald-400">{trueSavingsRate.toFixed(1)}%</span></div>
          </div>
        </div>
      </div>

      {/* Main Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        {/* Spending Category List with Toggle */}
        <div className="lg:col-span-2 premium-card card-hover">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Spending & Savings Breakdown</h2>
            </div>

            {/* Toggle Switch */}
            <div className="inline-flex glass-pill p-1 rounded-xl self-start sm:self-auto text-xs font-medium">
              <button
                type="button"
                onClick={() => setViewMode('outflow')}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  viewMode === 'outflow'
                    ? 'button-active text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                % of Outflow
              </button>
              <button
                type="button"
                onClick={() => setViewMode('income')}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  viewMode === 'income'
                    ? 'button-active text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                % of Income
              </button>
            </div>
          </div>

          {categoryList.length === 0 ? (
            <div className="py-16 text-center text-slate-500 bg-gradient-to-b from-slate-800/40 to-slate-900/20 rounded-xl border border-slate-700/50">
              <div className="text-3xl mb-2">📊</div>
              <p>No transactions or savings deposits logged yet.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {categoryList.map((cat, idx) => {
                const displayPercent = viewMode === 'outflow' ? cat.percentOutflowDisplay : cat.percentIncomeDisplay;
                const exactPercent = viewMode === 'outflow' ? cat.percentOutflowExact : cat.percentIncomeExact;
                const baseTotal = viewMode === 'outflow' ? totalOutflow : totalIncome;
                const headRoom = baseTotal - cat.amount;

                return (
                  <div key={idx} className="category-row space-y-2 group relative bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-200 text-sm group-hover:text-white transition-colors">{cat.name}</span>
                      
                      {/* Interactive Tooltip on Hover */}
                      <div className="relative flex items-center gap-2 cursor-pointer">
                        <span className="font-bold text-white">₹{cat.amount.toLocaleString()}</span>
                        <span className="text-slate-300 text-xs bg-slate-700/70 px-3 py-1 rounded-lg border border-slate-600/50 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-all">
                          {displayPercent}%
                        </span>

                        {/* Floating Detailed Card */}
                        <div className="absolute right-0 bottom-full mb-3 hidden group-hover:flex flex-col bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl z-30 min-w-[240px] text-xs backdrop-blur-sm">
                          <div className="font-bold text-white border-b border-slate-700 pb-2 mb-3 flex justify-between">
                            <span>{cat.name}</span>
                            <span className="text-emerald-400 text-sm">{exactPercent}%</span>
                          </div>
                          <div className="text-slate-300 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Share of {viewMode}:</span>
                              <span className="text-white font-medium">{exactPercent}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Remaining base:</span>
                              <span className={headRoom < 0 ? 'text-rose-400 font-semibold' : 'text-cyan-300 font-medium'}>
                                ₹{headRoom.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Progress Bar */}
                    <div className="w-full bg-slate-700/40 rounded-full h-2.5 overflow-hidden border border-slate-600/30">
                      <div
                        className={`progress-bar-animated min-w-[6px] ${
                          cat.name === 'Savings' ? 'bg-indigo-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.max(displayPercent, 1)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Net Flow Summary */}
        <div className="premium-card card-hover flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-lg font-bold text-white">Cash Flow Ratio</h2>
            </div>

            <div className="space-y-3">
              <div className="group bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/30 rounded-xl p-4 hover:border-emerald-400/50 transition-all">
                <span className="text-[10px] text-emerald-300/80 uppercase tracking-wider font-semibold block mb-2">Total Inflow</span>
                <span className="text-2xl font-bold text-emerald-400 stat-value block">₹{totalIncome.toLocaleString()}</span>
              </div>

              <div className="group bg-gradient-to-br from-rose-500/15 to-rose-500/5 border border-rose-500/30 rounded-xl p-4 hover:border-rose-400/50 transition-all">
                <span className="text-[10px] text-rose-300/80 uppercase tracking-wider font-semibold block mb-2">Total Outflow</span>
                <span className="text-2xl font-bold text-rose-400 stat-value block">₹{totalOutflow.toLocaleString()}</span>
              </div>

              <div className="group bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 border border-cyan-500/30 rounded-xl p-4 hover:border-cyan-400/50 transition-all">
                <span className="text-[10px] text-cyan-300/80 uppercase tracking-wider font-semibold block mb-2">Net Retained Wealth</span>
                <span className={`text-2xl font-bold stat-value block ${
                  netRetained < 0 ? 'text-rose-400' : 'text-cyan-400'
                }`}>
                  ₹{netRetained.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-700/40 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
            <HelpCircle className="w-4 h-4" />
            <span>Hover over categories &amp; metrics for detailed insights.</span>
          </div>
        </div>
      </div>
    </div>
  );
}