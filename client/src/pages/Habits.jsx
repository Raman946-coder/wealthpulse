import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Flame, 
  TrendingUp, 
  Plus, 
  Award, 
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Calendar,
  Check
} from 'lucide-react';

const CORE_FINANCIAL_HABITS = [
  {
    id: 'track-expenses',
    title: 'Daily Expense Logging',
    description: 'Log every transaction made today, no matter how small',
    category: 'Budgeting',
    streak: 0,
    history: {},
    isDefault: true
  },
  {
    id: 'no-impulse-buy',
    title: 'Zero Impulse Spending',
    description: 'Avoid non-essential purchases outside your monthly budget plan',
    category: 'Discipline',
    streak: 0,
    history: {},
    isDefault: true
  },
  {
    id: 'review-portfolio',
    title: 'Pulse Check & Market Review',
    description: 'Check net worth status or daily market updates for 5 mins',
    category: 'Investing',
    streak: 0,
    history: {},
    isDefault: true
  },
  {
    id: 'savings-first',
    title: 'Pay Yourself First',
    description: 'Allocate daily or periodic micro-savings directly into wealth accounts',
    category: 'Saving',
    streak: 0,
    history: {},
    isDefault: true
  }
];

export default function Habits({ user }) {
  // Isolate localStorage key per logged-in user
  const userStorageKey = `wp_financial_habits_${user?._id || user?.id || user?.email || 'guest'}`;
  const todayKey = new Date().toISOString().split('T')[0];

  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem(userStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((h) => ({
          ...h,
          completedToday: !!h.history?.[todayKey]
        }));
      } catch (e) {
        return CORE_FINANCIAL_HABITS.map(h => ({ ...h, completedToday: false }));
      }
    }
    return CORE_FINANCIAL_HABITS.map(h => ({ ...h, completedToday: false }));
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Budgeting');

  // Sync to localStorage whenever user habits change
  useEffect(() => {
    localStorage.setItem(userStorageKey, JSON.stringify(habits));
  }, [habits, userStorageKey]);

  const toggleHabit = (id) => {
    setHabits((prevHabits) =>
      prevHabits.map((habit) => {
        if (habit.id !== id) return habit;

        const isCurrentlyCompleted = !!habit.history?.[todayKey];
        const updatedHistory = { ...habit.history };

        let newStreak = habit.streak;

        if (isCurrentlyCompleted) {
          delete updatedHistory[todayKey];
          newStreak = Math.max(0, newStreak - 1);
        } else {
          updatedHistory[todayKey] = true;
          newStreak = newStreak + 1;
        }

        return {
          ...habit,
          streak: newStreak,
          history: updatedHistory,
          completedToday: !isCurrentlyCompleted
        };
      })
    );
  };

  const handleCreateHabit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const customHabit = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Custom user financial discipline goal',
      category: newCategory,
      streak: 0,
      history: {},
      isDefault: false,
      completedToday: false
    };

    setHabits((prev) => [...prev, customHabit]);
    setNewTitle('');
    setNewDesc('');
    setNewCategory('Budgeting');
    setShowAddModal(false);
  };

  const resetHabits = () => {
    if (window.confirm('Reset all financial habits back to default baseline state?')) {
      setHabits(CORE_FINANCIAL_HABITS.map(h => ({ ...h, completedToday: false })));
      localStorage.removeItem(userStorageKey);
    }
  };

  // Analytics Metrics
  const completedCount = habits.filter((h) => h.completedToday).length;
  const totalCount = habits.length;
  const completionPercentage = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const maxStreak = habits.length ? Math.max(...habits.map((h) => h.streak)) : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            Financial Habit Engine
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </h1>
          <p className="text-slate-400 mt-1">
            Build wealth through systematic daily micro-habits and track real-time consistency.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-lg shadow-emerald-500/10"
          >
            <Plus className="w-5 h-5" />
            <span>New Custom Habit</span>
          </button>
          <button
            onClick={resetHabits}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors border border-slate-700/50"
            title="Reset Habits Baseline"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Today's Progress</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-white">{completedCount}/{totalCount}</span>
              <span className="text-sm font-medium text-emerald-400">({completionPercentage}%)</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Completed tasks today</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Top Active Streak</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-white">{maxStreak}</span>
              <span className="text-sm font-medium text-amber-400">Days</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Current longest habit chain</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Habit Status</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-white">
                {completionPercentage === 100 ? 'Optimal' : completionPercentage > 50 ? 'Strong' : 'Building'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Consistency health check</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Habits List Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-400" />
          Daily Financial Habits
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className={`bg-slate-900 border transition-all rounded-xl p-5 flex flex-col justify-between ${
                habit.completedToday 
                  ? 'border-emerald-500/40 bg-emerald-950/10' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 mb-2">
                      {habit.category}
                    </span>
                    <h3 className="text-lg font-semibold text-white">{habit.title}</h3>
                  </div>
                  
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                    <Flame className="w-4 h-4 fill-amber-400/20" />
                    <span>{habit.streak}d</span>
                  </div>
                </div>

                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  {habit.description}
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Status: {habit.completedToday ? (
                    <span className="text-emerald-400 font-semibold">Completed Today</span>
                  ) : (
                    <span className="text-slate-400">Pending</span>
                  )}
                </span>

                <button
                  onClick={() => toggleHabit(habit.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    habit.completedToday
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {habit.completedToday ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Done</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Complete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Custom Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-4">Create Financial Habit</h3>
            
            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Habit Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Read financial news"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 text-sm"
                >
                  <option value="Budgeting">Budgeting</option>
                  <option value="Discipline">Discipline</option>
                  <option value="Investing">Investing</option>
                  <option value="Saving">Saving</option>
                  <option value="Learning">Learning</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Short description of this discipline step..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-lg text-sm transition-colors"
                >
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}