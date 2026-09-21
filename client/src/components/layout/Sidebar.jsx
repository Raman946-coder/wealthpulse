import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  CheckSquare,
  Target,
  PieChart,
  Shield,
  MessageSquare,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export default function Sidebar({ user, onLogout, isMobileMenuOpen, onMobileMenuToggle }) {
  const isLinkActive = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-slate-800 text-emerald-400 border-l-4 border-emerald-400 md:border-l-4 md:border-emerald-400 border-t-2 md:border-t-0'
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
    }`;

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation menu"
        onClick={onMobileMenuToggle}
        className="md:hidden fixed top-4 left-4 z-50 inline-flex items-center justify-center rounded-xl border border-emerald-400/30 bg-slate-900/90 p-2.5 text-emerald-300 shadow-lg backdrop-blur-sm"
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        className={`w-[85vw] max-w-[320px] md:w-72 premium-panel border-b md:border-b-0 md:border-r md:h-screen sticky top-0 flex flex-col justify-between p-4 flex-shrink-0 z-40 transition-transform duration-300 ease-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          fixed inset-y-0 left-0 md:static`}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between gap-3 px-2 mb-8 mt-2 md:justify-start">
            <div className="flex items-center gap-3">
              <div className="brand-badge rounded-xl p-2.5">
                <img 
                  src="/favicon-32x32.png" 
                  alt="WealthPulse Favicon" 
                  className="w-8 h-8 object-contain rounded-lg" 
                />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-emerald-300/80">Fintech</div>
                <span className="font-bold text-xl text-white tracking-tight">WealthPulse</span>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={onMobileMenuToggle}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/80 text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="sidebar-nav space-y-2">
            <NavLink to="/dashboard" className={isLinkActive} onClick={() => setTimeout(() => onMobileMenuToggle?.(), 150)}>
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink to="/transactions" className={isLinkActive} onClick={() => setTimeout(() => onMobileMenuToggle?.(), 150)}>
              <Receipt className="w-5 h-5" />
              <span>Transactions</span>
            </NavLink>

            <NavLink to="/habits" className={isLinkActive} onClick={() => setTimeout(() => onMobileMenuToggle?.(), 150)}>
              <CheckSquare className="w-5 h-5" />
              <span>Habits</span>
            </NavLink>

            <NavLink to="/goals" className={isLinkActive} onClick={() => setTimeout(() => onMobileMenuToggle?.(), 150)}>
              <Target className="w-5 h-5" />
              <span>Goals</span>
            </NavLink>

            <NavLink to="/analytics" className={isLinkActive} onClick={() => setTimeout(() => onMobileMenuToggle?.(), 150)}>
              <PieChart className="w-5 h-5" />
              <span>Analytics</span>
            </NavLink>

            <NavLink to="/reports" className={isLinkActive} onClick={() => setTimeout(() => onMobileMenuToggle?.(), 150)}>
              <Receipt className="w-5 h-5" />
              <span>Reports</span>
            </NavLink>

            <NavLink to="/investments" className={isLinkActive} onClick={() => setTimeout(() => onMobileMenuToggle?.(), 150)}>
              <Target className="w-5 h-5" />
              <span>Investments</span>
            </NavLink>

            <NavLink to="/feedback" className={isLinkActive} onClick={() => setTimeout(() => onMobileMenuToggle?.(), 150)}>
              <MessageSquare className="w-5 h-5" />
              <span>Feedback &amp; Support</span>
            </NavLink>

            {user?.role === 'admin' && (
              <NavLink to="/admin" className={isLinkActive} onClick={() => setTimeout(() => onMobileMenuToggle?.(), 150)}>
                <Shield className="w-5 h-5" />
                <span>Admin</span>
              </NavLink>
            )}
          </nav>
        </div>

        <div className="pt-4 mt-4 border-t border-slate-800/80 bg-slate-950/25 rounded-xl p-3">
          <div className="px-2 mb-3">
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 block font-semibold">Logged in as</span>
            <span className="text-sm font-medium text-emerald-400 truncate block mt-1">
              {user?.name || user?.email || 'User Account'}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-300 bg-rose-500/5 border border-rose-500/15 hover:bg-rose-500/10 hover:text-rose-200 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}