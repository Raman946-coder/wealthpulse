import React, { useState } from 'react';
import axios from 'axios';
import { User, Shield, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import API_URL from '../utils/api';

export default function Login({ onLoginSuccess, onLogin }) {
  const [role, setRole] = useState('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        { email, password, role },
        { withCredentials: true }
      );

      // Extract user object from backend response
      const userData = response.data.user;
      const callback = onLoginSuccess || onLogin;

      if (callback) {
        callback(userData);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Authentication failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100 font-sans">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/80 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/favicon-32x32.png" 
            alt="WealthPulse Favicon" 
            className="w-12 h-12 object-contain rounded-xl mb-3 shadow-md" 
          />
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome to WealthPulse
          </h1>
        </div>

        {/* Role Toggle Switcher */}
        <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800/60">
          <button
            type="button"
            onClick={() => { setRole('user'); setError(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              role === 'user'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Standard User</span>
          </button>

          <button
            type="button"
            onClick={() => { setRole('admin'); setError(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              role === 'admin'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Administrator</span>
          </button>
        </div>

        {/* Dynamic Error Box */}
        {error && (
          <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs leading-relaxed mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/10 active:scale-[0.99] disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Authenticating...' : `Sign In as ${role === 'admin' ? 'Administrator' : 'User'}`}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <a href="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4 ml-1">
            Sign Up
          </a>
        </div>

      </div>
    </div>
  );
}