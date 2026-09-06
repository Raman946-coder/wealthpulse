import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldAlert, ArrowRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
      {/* App Header */}
      <div className="text-center mb-12">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center font-bold text-slate-900 text-3xl mx-auto mb-4 shadow-lg shadow-emerald-500/20">
          W
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Welcome to WealthPulse</h1>
        <p className="text-slate-400 mt-2 text-lg">Build financial habits & track wealth growth over time</p>
      </div>

      {/* Role Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl w-full">
        {/* User Card */}
        <div 
          onClick={() => navigate('/login?role=user')}
          className="group relative bg-slate-800/80 border border-slate-700 hover:border-emerald-500 rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold mb-2">User Portal</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Track daily expenses, build saving habits, manage goals, and monitor your personal net worth.
            </p>
          </div>
          <div className="mt-8 flex items-center text-emerald-400 font-semibold text-sm group-hover:translate-x-1 transition-transform">
            Continue as User <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </div>

        {/* Admin Card */}
        <div 
          onClick={() => navigate('/login?role=admin')}
          className="group relative bg-slate-800/80 border border-slate-700 hover:border-indigo-500 rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Admin Portal</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Monitor active users, view platform usage analytics, and manage platform performance metrics.
            </p>
          </div>
          <div className="mt-8 flex items-center text-indigo-400 font-semibold text-sm group-hover:translate-x-1 transition-transform">
            Continue as Admin <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </div>
      </div>
    </div>
  );
}