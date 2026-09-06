import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle2, MessageSquare, Send } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/feedback';

const statusStyles = {
  open: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
  in_progress: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20',
  resolved: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
};

const statusLabel = (status) => status.replace('_', ' ');

export default function Feedback() {
  const [form, setForm] = useState({ subject: '', message: '' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

  const loadFeedback = async () => {
    try {
      const response = await axios.get(API_URL, { withCredentials: true });
      setItems(response.data);
    } catch (error) {
      setNotice({ type: 'error', text: error.response?.data?.message || 'Unable to load feedback.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFeedback(); }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setNotice({ type: '', text: '' });
    try {
      await axios.post(API_URL, form, { withCredentials: true });
      setForm({ subject: '', message: '' });
      setNotice({ type: 'success', text: 'Your feedback has been sent to the WealthPulse team.' });
      await loadFeedback();
    } catch (error) {
      setNotice({ type: 'error', text: error.response?.data?.message || 'Unable to submit feedback.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header className="border-b border-slate-800/80 pb-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300"><MessageSquare className="h-4 w-4" /> Support desk</div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Feedback and issues</h1>
        <p className="mt-2 text-sm text-slate-400">Tell us what is working, what is not, or where WealthPulse can serve you better.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.1fr]">
        <form onSubmit={handleSubmit} className="premium-card rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white">Start a conversation</h2>
          <p className="mt-1 text-sm text-slate-500">Our team will review your request and update its status here.</p>
          <div className="mt-6 space-y-4">
            <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Subject</span><input required maxLength={120} value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="What can we help with?" className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-400" /></label>
            <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Message</span><textarea required maxLength={2000} rows={7} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Share details so we can understand the situation." className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm leading-relaxed text-white outline-none placeholder:text-slate-600 focus:border-emerald-400" /></label>
            <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"><Send className="h-4 w-4" />{submitting ? 'Sending...' : 'Send feedback'}</button>
          </div>
          {notice.text && <div className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${notice.type === 'success' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-rose-400/20 bg-rose-400/10 text-rose-300'}`}>{notice.type === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}{notice.text}</div>}
        </form>

        <section className="premium-card overflow-hidden rounded-2xl">
          <div className="border-b border-slate-800 px-6 py-5"><h2 className="text-lg font-bold text-white">Your requests</h2><p className="mt-1 text-sm text-slate-500">Track conversations with the WealthPulse team.</p></div>
          {loading ? <div className="p-8 text-center text-sm text-slate-500">Loading your requests...</div> : items.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">Your submitted feedback will appear here.</div> : <div className="divide-y divide-slate-800/70">{items.map((item) => <article key={item._id} className="space-y-3 p-5"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-slate-200">{item.subject}</h3><span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] capitalize ${statusStyles[item.status] || statusStyles.open}`}>{statusLabel(item.status)}</span></div><p className="text-sm leading-relaxed text-slate-400">{item.message}</p><p className="text-xs text-slate-600">Submitted {new Date(item.createdAt).toLocaleDateString('en-IN')}</p></article>)}</div>}
        </section>
      </div>
    </div>
  );
}
