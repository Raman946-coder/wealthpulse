import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../utils/api';

export default function Onboarding({ user, onComplete }) {
  const [profile, setProfile] = useState({
    name: user?.name || '',
    contactDetails: user?.financialProfile?.contactDetails || '',
    financialGoals: user?.financialProfile?.financialGoals || '',
    financialActivityHistory: user?.financialProfile?.financialActivityHistory || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const storedAuth = JSON.parse(localStorage.getItem('wp_auth_user') || '{}');
      const token = storedAuth.token || localStorage.getItem('token');

      const response = await api.post(
        '/api/auth/onboarding',
        {
          contactDetails: profile.contactDetails,
          financialGoals: profile.financialGoals,
          financialActivityHistory: profile.financialActivityHistory,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        }
      );

      const updatedUser = {
        ...user,
        isProfileComplete: true,
        financialProfile: response.data.financialProfile || {
          contactDetails: profile.contactDetails,
          financialGoals: profile.financialGoals,
          financialActivityHistory: profile.financialActivityHistory,
        },
      };

      localStorage.setItem('wp_auth_user', JSON.stringify(updatedUser));
      setSubmitted(true);

      setTimeout(() => {
        if (onComplete) onComplete(updatedUser);
      }, 1000);
    } catch (err) {
      console.error('Onboarding submission error:', err);
      setError(
        err.response?.data?.message || 'Failed to update financial profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Profile setup complete</h1>
          <p className="text-slate-400">
            Your user profile has been saved to the database. Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
      <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-400 font-semibold">Setup</p>
          <h1 className="text-3xl font-bold mt-2">Tell us about your financial profile</h1>
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs leading-relaxed mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
              Name
            </label>
            <input
              value={profile.name}
              disabled
              className="w-full bg-slate-950/60 border border-slate-800/80 text-slate-400 rounded-xl px-4 py-3 cursor-not-allowed text-sm"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
              Contact details
            </label>
            <input
              value={profile.contactDetails}
              onChange={(e) => handleChange('contactDetails', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              placeholder="Phone / email / address"
              required
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
              Financial goals
            </label>
            <textarea
              value={profile.financialGoals}
              onChange={(e) => handleChange('financialGoals', e.target.value)}
              rows="3"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 resize-none text-sm text-white focus:outline-none focus:border-emerald-500"
              placeholder="Describe your goals, such as emergency fund, home purchase, investment target"
              required
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
              Financial activity history
            </label>
            <textarea
              value={profile.financialActivityHistory}
              onChange={(e) => handleChange('financialActivityHistory', e.target.value)}
              rows="4"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 resize-none text-sm text-white focus:outline-none focus:border-emerald-500"
              placeholder="Share transaction history, income streams, recurring expenses, investments..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Saving Profile...' : 'Continue'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}