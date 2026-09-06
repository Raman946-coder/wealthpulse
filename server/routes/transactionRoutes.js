const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const protect = require('../middleware/authMiddleware');
const Transaction = require('../models/Transaction');

const getUserId = (req) => req.user?._id || req.user?.id || req.user?.userId;

router.get('/', protect, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { category, type, limit } = req.query;

    const query = { user: new mongoose.Types.ObjectId(userId) };
    if (category) query.category = category;
    if (type) query.type = type;

    let dbQuery = Transaction.find(query).sort({ date: -1, createdAt: -1 });
    if (limit) dbQuery = dbQuery.limit(parseInt(limit, 10));

    const transactions = await dbQuery;
    res.json(transactions);
  } catch (err) {
    console.error('Error fetching user transactions:', err);
    res.status(500).json({ message: 'Server error while fetching transactions' });
  }
});

router.get('/summary', protect, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(getUserId(req));

    const summary = await Transaction.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
          },
          totalExpense: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
          },
          allocatedToGoals: {
            $sum: {
              $cond: [
                { $in: ['$category', ['Savings', 'Goals']] },
                '$amount',
                0
              ]
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = summary[0] || { totalIncome: 0, totalExpense: 0, allocatedToGoals: 0, count: 0 };
    const availableCash = stats.totalIncome - stats.totalExpense;

    res.json({
      totalIncome: stats.totalIncome,
      totalExpense: stats.totalExpense,
      availableCash,
      allocatedToGoals: stats.allocatedToGoals,
      netBalance: availableCash + stats.allocatedToGoals,
      transactionCount: stats.count,
    });
  } catch (err) {
    console.error('Error calculating transaction summary:', err);
    res.status(500).json({ message: 'Server error while computing metrics' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { description, amount, type, category, date } = req.body;

    if (!description || !amount || !type || !category) {
      return res.status(400).json({ message: 'Please provide all required transaction fields' });
    }

    const entryAmount = Number(amount);
    if (Number.isNaN(entryAmount) || entryAmount <= 0) {
      return res.status(400).json({ message: 'Transaction amount must be greater than zero.' });
    }

    if (type === 'expense') {
      const summary = await Transaction.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
            expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } }
          }
        }
      ]);

      const totals = summary[0] || { income: 0, expense: 0 };
      const availableCash = Math.max(0, totals.income - totals.expense);

      if (entryAmount > availableCash) {
        return res.status(400).json({
          message: `Not enough available cash. You can only spend up to ₹${availableCash.toLocaleString('en-IN')} right now.`
        });
      }
    }

    const newTransaction = new Transaction({
      user: userId,
      description,
      amount: entryAmount,
      type,
      category,
      date: date || new Date().toISOString(),
    });

    const savedTransaction = await newTransaction.save();
    res.status(201).json(savedTransaction);
  } catch (err) {
    console.error('Error creating transaction:', err);
    res.status(500).json({ message: 'Server error while saving transaction' });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const userId = getUserId(req);
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.user.toString() !== userId.toString()) {
      return res.status(401).json({ message: 'Not authorized to modify this transaction' });
    }

    const { description, amount, type, category, date } = req.body;
    if (description) transaction.description = description;
    if (amount !== undefined) transaction.amount = Number(amount);
    if (type) transaction.type = type;
    if (category) transaction.category = category;
    if (date) transaction.date = date;

    const updatedTransaction = await transaction.save();
    res.json(updatedTransaction);
  } catch (err) {
    console.error('Error updating transaction:', err);
    res.status(500).json({ message: 'Server error while updating transaction' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const userId = getUserId(req);
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.user.toString() !== userId.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this transaction' });
    }

    await transaction.deleteOne();
    res.json({ message: 'Transaction successfully deleted', id: req.params.id });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ message: 'Server error while deleting transaction' });
  }
});

module.exports = router;