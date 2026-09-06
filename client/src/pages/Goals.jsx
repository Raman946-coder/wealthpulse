import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { 
  Target, 
  Plus, 
  TrendingUp, 
  PiggyBank, 
  Trash2, 
  X, 
  CheckCircle2 
} from 'lucide-react';

export default function Goals({ user }) {
  const userKey = user?._id || user?.id || user?.email || 'guest';
  const goalsStorageKey = `wp_savings_goals_${userKey}`;

  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem(goalsStorageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [error, setError] = useState('');

  const [newGoal, setNewGoal] = useState({
    title: '',
    category: 'Savings',
    targetAmount: '',
    currentAmount: '',
    deadline: ''
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(goalsStorageKey, JSON.stringify(goals));
  }, [goals, goalsStorageKey]);

  const getBalanceSnapshot = () => {
    const userTransactionsKey = `wp_transactions_${userKey}`;
    const saved = localStorage.getItem(userTransactionsKey);
    const currentData = saved ? JSON.parse(saved) : [];

    const totalIncome = currentData
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const totalExpense = currentData
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const allocatedToGoals = currentData
      .filter((t) => t.category === 'Savings' || t.category === 'Goals')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const availableCash = Math.max(0, totalIncome - totalExpense);

    return {
      totalIncome,
      totalExpense,
      allocatedToGoals,
      availableCash,
      netBalance: availableCash + allocatedToGoals,
    };
  };

  const writeGoalsToStorage = (nextGoals) => {
    localStorage.setItem(goalsStorageKey, JSON.stringify(nextGoals));
  };

  const refreshGoalsFromTransactions = () => {
    const userTransactionsKey = `wp_transactions_${userKey}`;
    const savedGoals = JSON.parse(localStorage.getItem(goalsStorageKey) || '[]');
    const transactions = JSON.parse(localStorage.getItem(userTransactionsKey) || '[]');

    const nextGoals = savedGoals
      .map((goal) => {
        const goalTitle = String(goal.title || '').toLowerCase();
        const contributedAmount = transactions
          .filter((tx) => {
            const title = String(tx?.title || tx?.description || '').toLowerCase();
            return (
              title === `initial savings: ${goalTitle}` ||
              title === `deposit to ${goalTitle}` ||
              (title.includes(goalTitle) && (tx?.category === 'Savings' || tx?.type === 'expense'))
            );
          })
          .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

        return {
          ...goal,
          currentAmount: Math.max(0, contributedAmount)
        };
      })
      .filter((goal) => Number(goal.targetAmount || 0) > 0 || Number(goal.currentAmount || 0) > 0);

    setGoals(nextGoals);
    localStorage.setItem(goalsStorageKey, JSON.stringify(nextGoals));
  };

  useEffect(() => {
    const refresh = () => refreshGoalsFromTransactions();
    refresh();
    window.addEventListener('wealthpulse:transactions-updated', refresh);

    return () => {
      window.removeEventListener('wealthpulse:transactions-updated', refresh);
    };
  }, [userKey]);

  const persistGoalTransaction = async ({ title, amount, date = new Date().toISOString().split('T')[0] }) => {
    const userTransactionsKey = `wp_transactions_${userKey}`;
    const newTransaction = {
      id: Date.now().toString(),
      title,
      description: title,
      amount,
      type: 'expense',
      category: 'Savings',
      date
    };

    const existingTransactions = JSON.parse(localStorage.getItem(userTransactionsKey) || '[]');
    const nextTransactions = [newTransaction, ...existingTransactions];
    localStorage.setItem(userTransactionsKey, JSON.stringify(nextTransactions));

    try {
      await axios.post(
        `${API_URL}/api/transactions`,
        {
          description: title,
          amount,
          type: 'expense',
          category: 'Savings',
          date,
        },
        { withCredentials: true }
      );
    } catch (error) {
      console.warn('Goal deposit not synced to server, kept in user-local data only.', error);
    }
  };

  const removeGoalTransactions = async (goalTitle) => {
    const userTransactionsKey = `wp_transactions_${userKey}`;
    const existingTransactions = JSON.parse(localStorage.getItem(userTransactionsKey) || '[]');
    const targetTitle = goalTitle.toLowerCase();

    const shouldRemove = (tx) => {
      const title = String(tx?.title || tx?.description || '').toLowerCase();
      return (
        title === `initial savings: ${targetTitle}` ||
        title === `deposit to ${targetTitle}` ||
        (title.includes(targetTitle) && (tx?.category === 'Savings' || tx?.type === 'expense'))
      );
    };

    const remainingTransactions = existingTransactions.filter((tx) => !shouldRemove(tx));
    localStorage.setItem(userTransactionsKey, JSON.stringify(remainingTransactions));

    try {
      const response = await axios.get(`${API_URL}/api/transactions`, { withCredentials: true });
      const remoteTransactions = Array.isArray(response.data) ? response.data : [];
      const matchingRemoteTransactions = remoteTransactions.filter((tx) => shouldRemove(tx));

      await Promise.all(
        matchingRemoteTransactions.map((tx) =>
          axios.delete(`${API_URL}/api/transactions/${tx._id || tx.id}`, {
            withCredentials: true,
          })
        )
      );
    } catch (error) {
      console.warn('Goal transaction cleanup from server failed.', error);
    }
  };

  // Handle Create Goal
  const handleAddGoal = (e) => {
    e.preventDefault();

    const trimmedTitle = newGoal.title.trim();
    const targetAmount = Number.parseFloat(newGoal.targetAmount);
    const initialDeposit = Number.parseFloat(newGoal.currentAmount) || 0;

    if (!trimmedTitle || !Number.isFinite(targetAmount) || targetAmount <= 0) {
      setError('Please enter a valid goal title and target amount greater than zero.');
      return;
    }

    const balanceSnapshot = getBalanceSnapshot();

    if (initialDeposit > 0 && initialDeposit > balanceSnapshot.availableCash) {
      setError(`Not enough available cash. You can only add up to ₹${balanceSnapshot.availableCash.toLocaleString('en-IN')} to goals right now.`);
      return;
    }

    setError('');

    const created = {
      id: Date.now().toString(),
      title: trimmedTitle,
      category: newGoal.category,
      targetAmount,
      currentAmount: initialDeposit,
      deadline: newGoal.deadline || new Date().toISOString().split('T')[0]
    };

    const nextGoals = [...(Array.isArray(goals) ? goals : []), created];
    setGoals(nextGoals);
    writeGoalsToStorage(nextGoals);

    if (initialDeposit > 0) {
      persistGoalTransaction({
        title: `Initial Savings: ${trimmedTitle}`,
        amount: initialDeposit,
        date: new Date().toISOString().split('T')[0]
      });
    }

    window.dispatchEvent(new CustomEvent('wealthpulse:transactions-updated'));

    setNewGoal({ title: '', category: 'Savings', targetAmount: '', currentAmount: '', deadline: '' });
    setIsAddModalOpen(false);
  };

  // Handle Deposit / Contribution
  const handleDeposit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0 || !selectedGoal) return;

    const balanceSnapshot = getBalanceSnapshot();
    if (amount > balanceSnapshot.availableCash) {
      setError(`Not enough available balance to fund this goal. You can add up to ₹${balanceSnapshot.availableCash.toLocaleString('en-IN')}.`);
      return;
    }

    setError('');

    setGoals((prev) => {
      const nextGoals = prev.map((g) => {
        if (g.id === selectedGoal.id) {
          return {
            ...g,
            currentAmount: g.currentAmount + amount
          };
        }
        return g;
      });

      writeGoalsToStorage(nextGoals);
      return nextGoals;
    });

    await persistGoalTransaction({
      title: `Deposit to ${selectedGoal.title}`,
      amount,
      date: new Date().toISOString().split('T')[0]
    });

    window.dispatchEvent(new CustomEvent('wealthpulse:transactions-updated'));

    setIsDepositModalOpen(false);
    setSelectedGoal(null);
    setDepositAmount('');
  };

  // Handle Delete Goal
  const handleDeleteGoal = async (id) => {
    const goalToDelete = goals.find((g) => g.id === id);
    if (!goalToDelete) return;

    const isCompleted = goalToDelete.currentAmount >= goalToDelete.targetAmount;

    setGoals((prev) => {
      const nextGoals = prev.filter((g) => g.id !== id);
      writeGoalsToStorage(nextGoals);
      return nextGoals;
    });

    if (!isCompleted) {
      await removeGoalTransactions(goalToDelete.title);
    }

    window.dispatchEvent(new CustomEvent('wealthpulse:transactions-updated'));
  };

  // Aggregate Metrics
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const overallProgress = totalTarget === 0 ? 0 : Math.min(100, Math.round((totalSaved / totalTarget) * 100));

  return (
    <div className="space-y-6 text-white max-w-7xl mx-auto">
      {/* Header */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Savings Goals</h1>
          <p className="text-slate-400 text-sm mt-1">
            Track your financial targets, deposit progress, and measure long-term wealth milestones.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 w-full md:w-auto"
        >
          <Plus className="w-5 h-5" />
          Add Savings Goal
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Accumulated</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">₹{totalSaved.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Target</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-indigo-300">₹{totalTarget.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Progress</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-cyan-400">{overallProgress}%</span>
          </div>
          <div className="w-full bg-slate-700/60 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-cyan-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-800/40 rounded-2xl border border-slate-700/60">
            No savings goals established yet. Click "Add Savings Goal" to set your first goal!
          </div>
        ) : (
          goals.map((goal) => {
            const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
            const isCompleted = goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount;

            return (
              <div
                key={goal.id}
                className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-slate-600 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-lg text-white">{goal.title}</h3>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-md bg-slate-900/80 text-slate-400 border border-slate-700">
                    {goal.category}
                  </span>

                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Progress</span>
                      <span className={`font-bold ${isCompleted ? 'text-emerald-400' : 'text-slate-200'}`}>
                        ₹{goal.currentAmount.toLocaleString()} / ₹{goal.targetAmount.toLocaleString()}
                      </span>
                    </div>

                    <div className="w-full bg-slate-700/60 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                      <span>Target Date: {goal.deadline}</span>
                      <span className="font-semibold text-emerald-400">{pct}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between">
                  {isCompleted ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold py-2">
                      <CheckCircle2 className="w-4 h-4" /> Goal Achieved!
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedGoal(goal);
                        setIsDepositModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-slate-700/80 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 text-xs font-semibold py-2 px-3 rounded-xl transition-all"
                    >
                      <Plus className="w-4 h-4" /> Add Deposit
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create Goal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-4">
              <h3 className="text-xl font-bold text-white">Create Savings Goal</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Fund, Stock Portfolio"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Savings">Savings</option>
                  <option value="Investments">Investments</option>
                  <option value="Safety Net">Safety Net</option>
                  <option value="Personal Tech">Personal Tech</option>
                  <option value="Travel">Travel</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="100000"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Initial Savings (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newGoal.currentAmount}
                    onChange={(e) => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Date</label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-cyan-200">
                Available Cash: ₹{getBalanceSnapshot().availableCash.toLocaleString('en-IN')}
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-700/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-semibold transition-colors"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Deposit */}
      {isDepositModalOpen && selectedGoal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-4">
              <h3 className="text-xl font-bold text-white">Deposit to "{selectedGoal.title}"</h3>
              <button
                onClick={() => {
                  setIsDepositModalOpen(false);
                  setSelectedGoal(null);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Deposit Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 5000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-cyan-200">
                Available Cash: ₹{getBalanceSnapshot().availableCash.toLocaleString('en-IN')}
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDepositModalOpen(false);
                    setSelectedGoal(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-700/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-semibold transition-colors"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}