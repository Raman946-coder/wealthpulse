const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Habit = require('../models/Habit');
const Goal = require('../models/Goal');

// Basic Seed Endpoint to insert realistic sample data
router.get('/seed', async (req, res) => {
  try {
    await User.deleteMany({});
    await Transaction.deleteMany({});
    await Habit.deleteMany({});
    await Goal.deleteMany({});

    const user = await User.create({
      name: 'Raman Kumar',
      email: 'user@wealthpulse.app',
      password: 'password123'
    });

    await Transaction.create([
      { user: user._id, title: 'Salary', amount: 85000, type: 'income', category: 'Salary' },
      { user: user._id, title: 'Rent', amount: 22000, type: 'expense', category: 'Housing' },
      { user: user._id, title: 'Groceries', amount: 6500, type: 'expense', category: 'Food' }
    ]);

    await Habit.create([
      { user: user._id, name: 'Log daily expenses', streak: 14, completedToday: true },
      { user: user._id, name: 'No impulse purchases', streak: 6, completedToday: false }
    ]);

    await Goal.create([
      { user: user._id, title: 'Emergency Fund', targetAmount: 1500000, currentAmount: 950000 },
      { user: user._id, title: 'Index Fund Portfolio', targetAmount: 500000, currentAmount: 320000 }
    ]);

    res.json({ message: 'Seed data created successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;