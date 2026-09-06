import React, { useMemo, useState, useEffect } from 'react';
import { TrendingUp, ShieldCheck, Wallet, BriefcaseBusiness, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '../utils/finance';

const defaultAssets = [
  { id: '1', name: 'Mutual Fund', type: 'Investment', value: 120000, growth: 8.4 },
  { id: '2', name: 'Emergency Fund', type: 'Cash', value: 45000, growth: 2.1 },
  { id: '3', name: 'Stocks', type: 'Investment', value: 98000, growth: 12.8 },
];

export default function Investments({ user }) {
  const storageKey = `wp_investments_${user?._id || user?.id || user?.email || 'guest'}`;
  const [assets, setAssets] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultAssets;
      }
    }
    return defaultAssets;
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Investment', value: '', growth: '' });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(assets));
  }, [assets, storageKey]);

  const totals = useMemo(() => {
    const totalValue = assets.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const averageGrowth = assets.length
      ? assets.reduce((sum, item) => sum + Number(item.growth || 0), 0) / assets.length
      : 0;
    return { totalValue, averageGrowth };
  }, [assets]);

  const addAsset = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.value) return;

    setAssets((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        name: form.name.trim(),
        type: form.type,
        value: Number(form.value),
        growth: Number(form.growth || 0),
      },
    ]);

    setForm({ name: '', type: 'Investment', value: '', growth: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-6 text-white max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Investments & Assets</h1>
          <p className="text-slate-400 text-sm mt-1">Track portfolio value, returns, and cash reserves in one place.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 w-full md:w-auto"
        >
          <Plus className="w-5 h-5" />
          Add Asset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Portfolio</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Wallet className="w-5 h-5" /></div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-400">{formatCurrency(totals.totalValue)}</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg. Growth</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div>
          </div>
          <div className="mt-3 text-2xl font-bold text-cyan-400">{totals.averageGrowth.toFixed(1)}%</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Protected Assets</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
          </div>
          <div className="mt-3 text-2xl font-bold text-indigo-300">{assets.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {assets.map((asset) => (
          <div key={asset.id} className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{asset.type}</div>
                <h3 className="text-xl font-bold text-white mt-2">{asset.name}</h3>
              </div>
              <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${Number(asset.growth) >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {Number(asset.growth) >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Number(asset.growth).toFixed(1)}%
              </div>
            </div>
            <div className="mt-6 text-2xl font-bold text-white">{formatCurrency(asset.value)}</div>
            <div className="mt-4 text-xs text-slate-400">Performance snapshot for this asset.</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-4">
              <h3 className="text-xl font-bold text-white">Add Asset</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={addAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Asset Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" placeholder="e.g. Gold, SIP, Real Estate" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
                  <option value="Investment">Investment</option>
                  <option value="Cash">Cash</option>
                  <option value="Asset">Asset</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Value (₹)</label>
                  <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" placeholder="50000" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Growth (%)</label>
                  <input type="number" step="0.1" value={form.growth} onChange={(e) => setForm({ ...form, growth: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" placeholder="8.5" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-700/50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-semibold transition-colors">Save Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
