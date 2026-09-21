import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from './utils/api';

import Sidebar from './components/layout/Sidebar';

import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Habits from './pages/Habits';
import Goals from './pages/Goals';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Investments from './pages/Investments';
import Onboarding from './pages/Onboarding';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import Feedback from './pages/Feedback';

axios.defaults.withCredentials = true;

function AppContent() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('wp_auth_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const closeSidebarOnDesktop = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', closeSidebarOnDesktop);
    return () => window.removeEventListener('resize', closeSidebarOnDesktop);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const verifyUserSession = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/auth/me`);
        if (isMounted && response.data?.user) {
          setUser(response.data.user);
          localStorage.setItem('wp_auth_user', JSON.stringify(response.data.user));
        } else if (isMounted) {
          handleLogout(false);
        }
      } catch (err) {
        if (isMounted) {
          handleLogout(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verifyUserSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const clearLocalUserData = () => {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('wp_') || key === 'wp_auth_user')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
    sessionStorage.clear();
  };

  const handleLogout = (redirect = true) => {
    clearLocalUserData();
    setUser(null);

    axios.post(`${API_URL}/api/auth/logout`).catch(() => {});

    if (redirect) {
      navigate('/login');
    }
  };

  const handleLoginSuccess = (userData) => {
    const safeUser = userData || {};
    localStorage.setItem('wp_auth_user', JSON.stringify(safeUser));
    setUser(safeUser);

    navigate(safeUser.isProfileComplete ? '/dashboard' : '/onboarding');
  };

  const handleOnboardingComplete = (updatedUserData) => {
    const safeUser = updatedUserData || { ...user, isProfileComplete: true };
    localStorage.setItem('wp_auth_user', JSON.stringify(safeUser));
    setUser(safeUser);
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Authenticating WealthPulse...</span>
        </div>
      </div>
    );
  }

  const userKey = user?._id || user?.id || user?.email || 'guest';

  return (
    <div className="premium-shell min-h-screen text-slate-100 flex flex-col md:flex-row">
      {user ? (
        <>
          {isMobileSidebarOpen && (
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 z-30 bg-slate-950/70 md:hidden"
            />
          )}

          <Sidebar
            user={user}
            onLogout={handleLogout}
            isMobileMenuOpen={isMobileSidebarOpen}
            onMobileMenuToggle={() => setIsMobileSidebarOpen((prev) => !prev)}
          />

          <main className="flex-1 p-3 pt-16 sm:p-4 md:p-8 overflow-y-auto min-h-screen w-full">
            <div className="mx-auto max-w-7xl w-full">
              <Routes>
                <Route 
                  path="/onboarding" 
                  element={
                    <Onboarding 
                      user={user} 
                      onComplete={handleOnboardingComplete} 
                    />
                  } 
                />
                <Route path="/dashboard" element={<Dashboard key={`dash-${userKey}`} user={user} />} />
                <Route path="/transactions" element={<Transactions key={`tx-${userKey}`} user={user} />} />
                <Route path="/habits" element={<Habits key={`habits-${userKey}`} user={user} />} />
                <Route path="/goals" element={<Goals key={`goals-${userKey}`} user={user} />} />
                <Route path="/analytics" element={<Analytics key={`analytics-${userKey}`} user={user} />} />
                <Route path="/reports" element={<Reports key={`reports-${userKey}`} user={user} transactions={JSON.parse(localStorage.getItem(`wp_transactions_${userKey}`) || '[]')} />} />
                <Route path="/investments" element={<Investments key={`invest-${userKey}`} user={user} />} />
                <Route path="/feedback" element={<Feedback key={`feedback-${userKey}`} />} />

                {user?.role === 'admin' && (
                  <Route path="/admin" element={<Admin key={`admin-${userKey}`} user={user} />} />
                )}

                <Route path="*" element={<Navigate to={user?.isProfileComplete ? '/dashboard' : '/onboarding'} replace />} />
              </Routes>
            </div>
          </main>
        </>
      ) : (
        <div className="w-full min-h-screen flex items-center justify-center bg-slate-950/30">
          <Routes>
            <Route 
              path="/login" 
              element={<Login onLoginSuccess={handleLoginSuccess} />} 
            />
            <Route 
              path="/register" 
              element={<Register onLoginSuccess={handleLoginSuccess} />} 
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}