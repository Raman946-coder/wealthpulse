import React, { useMemo, useState } from 'react';
import { FileDown, CalendarDays, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency, getMonthlySpendingReport } from '../utils/finance';

export default function Reports({ user, transactions = [] }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const report = useMemo(() => getMonthlySpendingReport(transactions, selectedMonth), [transactions, selectedMonth]);

  const exportReport = () => {
    const lines = [
      `WealthPulse Monthly Spending Report - ${report.monthLabel}`,
      `Income: ${formatCurrency(report.income)}`,
      `Expenses: ${formatCurrency(report.expenses)}`,
      `Net Savings: ${formatCurrency(report.savings)}`,
      `Top category: ${report.topCategoryName} (${formatCurrency(report.topCategoryValue)})`,
      '',
      'Category breakdown:',
      ...Object.entries(report.categoryBreakdown).map(([name, value]) => `${name}: ${formatCurrency(value)}`),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wealthpulse-report-${report.monthKey}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 text-white max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Monthly Spending Reports</h1>
          <p className="text-slate-400 text-sm mt-1">Review spending patterns and export a quick monthly summary.</p>
        </div>
        <button onClick={exportReport} className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 w-full md:w-auto">
          <FileDown className="w-5 h-5" />
          Generate Report
        </button>
      </div>

      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2 text-slate-300">
            <CalendarDays className="w-5 h-5 text-emerald-400" />
            <label className="text-sm font-medium">Select month</label>
          </div>
          <input
            type="month"
            value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
            onChange={(e) => setSelectedMonth(new Date(`${e.target.value}-01T00:00:00`))}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Income</span>
            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-400">{formatCurrency(report.income)}</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expenses</span>
            <ArrowDownRight className="w-5 h-5 text-rose-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-rose-400">{formatCurrency(report.expenses)}</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Savings</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">₹</div>
          </div>
          <div className="mt-3 text-2xl font-bold text-cyan-400">{formatCurrency(report.savings)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4">Top category</h2>
          <div className="rounded-2xl bg-slate-900 border border-slate-700 p-5">
            <div className="text-sm text-slate-400">Leading spend</div>
            <div className="mt-2 text-2xl font-bold text-white">{report.topCategoryName}</div>
            <div className="mt-1 text-emerald-400 font-semibold">{formatCurrency(report.topCategoryValue)}</div>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4">Category distribution</h2>
          <div className="space-y-4">
            {Object.entries(report.categoryBreakdown).length === 0 ? (
              <div className="text-slate-500 py-8 text-center">No spending data for this month yet.</div>
            ) : (
              Object.entries(report.categoryBreakdown).map(([name, value]) => (
                <div key={name}>
                  <div className="flex justify-between text-sm text-slate-300 mb-1">
                    <span>{name}</span>
                    <span>{formatCurrency(value)}</span>
                  </div>
                  <div className="w-full bg-slate-700/60 rounded-full h-2.5">
                    <div className="h-2.5 rounded-full bg-emerald-500" style={{ width: `${Math.min((value / Math.max(report.expenses, 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
