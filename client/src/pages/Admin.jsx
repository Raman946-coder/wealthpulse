import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, AlertCircle, BarChart3, CheckCircle2, Shield, Trash2, Users } from 'lucide-react';
import API_URL from '../utils/api';

const ADMIN_API_URL = `${API_URL}/api/admin`;

const formatPercent = (value) => `${Math.round((value || 0) * 100)}%`;
const formatMonth = (value) => {
  if (!value) return '';
  return new Date(`${value}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short' });
};

function KpiCard({ label, value, detail, icon: Icon, tone }) {
  return (
    <div className="premium-card card-hover rounded-2xl p-5 border border-slate-700/50 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-semibold">{label}</p>
          <p className={`mt-3 text-3xl font-bold ${tone}`}>{value}</p>
        </div>
        <div className="rounded-xl bg-slate-800/80 p-3 text-slate-300"><Icon className="h-5 w-5" /></div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

export default function Admin() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOverview = async () => {
    try {
      const response = await axios.get(`${ADMIN_API_URL}/overview`, { withCredentials: true });
      setData(response.data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOverview(); }, []);

  const updateRole = async (id, role) => {
    await axios.patch(`${ADMIN_API_URL}/users/${id}`, { role }, { withCredentials: true });
    loadOverview();
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user and their associated data?')) return;
    await axios.delete(`${ADMIN_API_URL}/users/${id}`, { withCredentials: true });
    loadOverview();
  };

  const updateFeedback = async (id, status) => {
    await axios.patch(`${ADMIN_API_URL}/feedback/${id}`, { status }, { withCredentials: true });
    loadOverview();
  };

  if (loading) return <div className="py-20 text-center text-slate-400">Loading platform intelligence...</div>;
  if (error) return <div className="premium-card rounded-2xl p-8 text-center text-rose-300"><AlertCircle className="mx-auto mb-3 h-7 w-7" />{error}</div>;

  const { kpis, monthlyActivity = [], users = [], feedback = [] } = data;
  const maxActivity = Math.max(...monthlyActivity.map((month) => month.transactions), 1);

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 border-b border-slate-800/80 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400"><Shield className="h-4 w-4" /> Operations center</div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Platform overview</h1>
          <p className="mt-2 text-sm text-slate-400">A live readout of member activity, financial tracking, and support health.</p>
        </div>
        <button onClick={loadOverview} className="flex items-center gap-2 self-start rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-emerald-400/50 hover:text-emerald-300">Refresh data <Activity className="h-4 w-4" /></button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Active users" value={`${kpis.activeUsers}/${kpis.totalUsers}`} detail="Active in the last 30 days" icon={Users} tone="text-emerald-400" />
        <KpiCard label="Habit completion" value={formatPercent(kpis.habitCompletionRate)} detail="Completed habits today" icon={CheckCircle2} tone="text-cyan-300" />
        <KpiCard label="Goal completion" value={formatPercent(kpis.goalCompletionRate)} detail="Average progress to target" icon={BarChart3} tone="text-amber-300" />
        <KpiCard label="Engagement rate" value={formatPercent(kpis.engagementRate)} detail="Members active this month" icon={Activity} tone="text-blue-300" />
        <KpiCard label="Monthly tracking" value={kpis.monthlyTransactions} detail="Transactions recorded this month" icon={BarChart3} tone="text-rose-300" />
      </section>

      <section className="premium-card card-hover rounded-2xl p-6 transition-all duration-300 hover:border-cyan-400/30">
        <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-white">Financial tracking activity</h2><p className="mt-1 text-sm text-slate-500">Transaction volume over the last six months</p></div><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">Live</span></div>
        <div className="mt-7 flex h-44 items-end gap-3 sm:gap-6">
          {monthlyActivity.length === 0 ? <p className="w-full self-center text-center text-sm text-slate-500">No tracking activity yet.</p> : monthlyActivity.map((month) => (
            <div key={month.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-xs text-slate-400">{month.transactions}</span><div className="w-full max-w-14 rounded-t-lg bg-gradient-to-t from-emerald-600 to-cyan-300" style={{ height: `${Math.max(8, (month.transactions / maxActivity) * 100)}%` }} /><span className="text-xs font-medium text-slate-500">{formatMonth(month.month)}</span></div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="premium-card card-hover overflow-hidden rounded-2xl transition-all duration-300 hover:border-emerald-400/30">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5"><div><h2 className="text-lg font-bold text-white">User directory</h2><p className="mt-1 text-sm text-slate-500">Manage access and platform membership</p></div><span className="text-sm text-slate-500">{users.length} accounts</span></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-slate-950/40 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-6 py-3 font-semibold">Member</th><th className="px-4 py-3 font-semibold">Joined</th><th className="px-4 py-3 font-semibold">Role</th><th className="px-6 py-3 text-right font-semibold">Action</th></tr></thead><tbody className="divide-y divide-slate-800/70">{users.map((member) => <tr key={member._id} className="hover:bg-slate-800/20"><td className="px-6 py-4"><div className="font-semibold text-slate-200">{member.name}</div><div className="mt-1 text-xs text-slate-500">{member.email}</div></td><td className="px-4 py-4 text-slate-400">{new Date(member.createdAt).toLocaleDateString('en-IN')}</td><td className="px-4 py-4"><select value={member.role} onChange={(event) => updateRole(member._id, event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-300"><option value="user">User</option><option value="admin">Admin</option></select></td><td className="px-6 py-4 text-right"><button title="Delete user" onClick={() => deleteUser(member._id)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-400/10 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>
        </section>

        <section className="premium-card card-hover overflow-hidden rounded-2xl transition-all duration-300 hover:border-amber-400/30">
          <div className="border-b border-slate-800 px-6 py-5"><h2 className="text-lg font-bold text-white">Feedback queue</h2><p className="mt-1 text-sm text-slate-500">Resolve member issues and complaints</p></div>
          <div className="divide-y divide-slate-800/70">{feedback.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No feedback has been submitted.</div> : feedback.map((item) => <div key={item._id} className="space-y-3 p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-200">{item.subject}</p><p className="mt-1 text-xs text-slate-500">{item.user?.name || 'Member'} · {new Date(item.createdAt).toLocaleDateString('en-IN')}</p></div><select value={item.status} onChange={(event) => updateFeedback(item._id, event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-300"><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select></div><p className="text-sm leading-relaxed text-slate-400">{item.message}</p></div>)}</div>
        </section>
      </div>
    </div>
  );
}