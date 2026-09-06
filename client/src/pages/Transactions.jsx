import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  X,
  Trash2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function Transactions({ user }) {
  const userKey = user?._id || user?.id || user?.email || 'guest';
  const storageKey = `wp_transactions_${userKey}`;

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: 'Food',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = [
    'All',
    'Salary',
    'Freelance',
    'Housing',
    'Food',
    'Transport',
    'Utilities',
    'Entertainment',
    'Investments',
    'Healthcare',
    'Other'
  ];

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/transactions`, { withCredentials: true });
      const rawTransactions = Array.isArray(response.data) ? response.data : [];
      const normalized = rawTransactions.map((tx) => ({
        ...tx,
        id: tx._id || tx.id,
        title: tx.description || tx.title,
        amount: Number(tx.amount || 0),
        type: tx.type,
        category: tx.category,
        date: tx.date
      }));

      setTransactions(normalized);
      localStorage.setItem(storageKey, JSON.stringify(normalized));
    } catch (error) {
      if (error?.response?.status === 401) {
        setTransactions([]);
        localStorage.removeItem(storageKey);
      } else {
        const saved = localStorage.getItem(storageKey);
        try {
          setTransactions(saved ? JSON.parse(saved) : []);
        } catch (e) {
          setTransactions([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      localStorage.removeItem(storageKey);
      return;
    }

    fetchTransactions();
  }, [userKey, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(storageKey, JSON.stringify(transactions));
    }
  }, [transactions, userKey]);

  const filteredTransactions = transactions.filter((t) => {
    const title = (t.title || '').toLowerCase();
    const matchesSearch = title.includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesType = selectedType === 'all' || t.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const allocatedToGoals = transactions
    .filter((t) => t.category === 'Savings' || t.category === 'Goals')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const availableCash = Math.max(0, totalIncome - totalExpense);
  const netSavings = availableCash + allocatedToGoals;

  const notifyTransactionChange = () => {
    window.dispatchEvent(new CustomEvent('wealthpulse:transactions-updated'));
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;

    const amountValue = Number(formData.amount);
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      setError('Transaction amount must be greater than zero.');
      return;
    }

    if (formData.type === 'expense' && amountValue > availableCash) {
      setError(`Not enough balance. You can only spend up to ₹${availableCash.toLocaleString('en-IN')} right now.`);
      return;
    }

    setError('');

    const payload = {
      description: formData.title,
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      date: formData.date
    };

    try {
      const response = await axios.post(`${API_URL}/api/transactions`, payload, {
        withCredentials: true
      });

      const newEntry = {
        ...response.data,
        id: response.data._id || response.data.id,
        title: response.data.description,
        amount: Number(response.data.amount || 0),
        date: response.data.date
      };

      setTransactions((prev) => [newEntry, ...prev]);
      notifyTransactionChange();
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to save transaction.';
      setError(message);
      return;
    }

    setFormData({
      title: '',
      amount: '',
      type: 'expense',
      category: 'Food',
      date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    const transactionId = id;

    try {
      await axios.delete(`${API_URL}/api/transactions/${transactionId}`, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Failed to delete transaction via API, removing local copy only.', error);
    }

    setTransactions((prev) => prev.filter((t) => (t._id || t.id) !== id));
    notifyTransactionChange();
  };

  return (
    <div className="space-y-6 text-white max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Transactions</h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor and categorize your daily income and expenditures.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 w-full md:w-auto"
        >
          <Plus className="w-5 h-5" />
          Add Transaction
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-3 text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Income</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-400">₹{totalIncome.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Expenses</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-rose-400">₹{totalExpense.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Cash Flow</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold ${netSavings >= 0 ? 'text-white' : 'text-rose-400'}`}>
              ₹{netSavings.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Type Toggle */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-1 flex text-xs font-medium">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedType === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedType('income')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedType === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Income
            </button>
            <button
              onClick={() => setSelectedType('expense')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedType === 'expense' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Expenses
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 appearance-none pr-8"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700/80 bg-slate-900/40 text-xs text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Transaction</th>
                <th className="p-4">Category</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 pr-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-sm">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    No transactions match your criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="p-4 pl-6 font-medium text-white flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          item.type === 'income'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {item.type === 'income' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>
                      <span>{item.title}</span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-700/60 text-slate-300 border border-slate-600/50">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-xs">{item.date}</td>
                    <td className={`p-4 text-right font-bold ${item.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {item.type === 'income' ? '+' : '-'}₹{Number(item.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 pr-6 text-center">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1 rounded-lg hover:bg-slate-700/50"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-4">
              <h3 className="text-xl font-bold text-white">Add New Transaction</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grocery Store, Salary, Client Invoice"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {categories.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-cyan-200">
                Available Cash: ₹{availableCash.toLocaleString('en-IN')}
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-700/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-semibold transition-colors"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}