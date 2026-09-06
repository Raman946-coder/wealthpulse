const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Habit = require('../models/Habit');
const Goal = require('../models/Goal');
const Feedback = require('../models/Feedback');

const getOverview = async (req, res) => {
	try {
		const now = new Date();
		const thirtyDaysAgo = new Date(now);
		thirtyDaysAgo.setDate(now.getDate() - 30);
		const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

		const [users, transactions, habits, goals, feedback] = await Promise.all([
			User.find().select('name email role createdAt updatedAt').sort({ createdAt: -1 }).lean(),
			Transaction.find({ date: { $gte: sixMonthsAgo.toISOString() } }).select('user amount type date').lean(),
			Habit.find().select('user completedToday').lean(),
			Goal.find().select('user currentAmount targetAmount').lean(),
			Feedback.find().populate('user', 'name email').sort({ createdAt: -1 }).lean(),
		]);

		const activeUserIds = new Set([
			...transactions.filter((item) => new Date(item.date) >= thirtyDaysAgo).map((item) => String(item.user)),
			...users.filter((item) => new Date(item.updatedAt) >= thirtyDaysAgo).map((item) => String(item._id)),
		]);
		const monthlyActivity = new Map();
		transactions.forEach((item) => {
			const date = new Date(item.date);
			const key = date.toISOString().slice(0, 7);
			const month = monthlyActivity.get(key) || { month: key, transactions: 0, income: 0, expenses: 0 };
			month.transactions += 1;
			month[item.type === 'income' ? 'income' : 'expenses'] += item.amount;
			monthlyActivity.set(key, month);
		});

		const habitRate = habits.length ? habits.filter((habit) => habit.completedToday).length / habits.length : 0;
		const goalRate = goals.length
			? goals.reduce((total, goal) => total + Math.min(1, (goal.currentAmount || 0) / Math.max(goal.targetAmount || 1, 1)), 0) / goals.length
			: 0;

		res.json({
			kpis: {
				activeUsers: activeUserIds.size,
				totalUsers: users.length,
				habitCompletionRate: habitRate,
				goalCompletionRate: goalRate,
				engagementRate: users.length ? activeUserIds.size / users.length : 0,
				monthlyTransactions: transactions.filter((item) => new Date(item.date) >= monthStart).length,
			},
			monthlyActivity: Array.from(monthlyActivity.values()).sort((a, b) => a.month.localeCompare(b.month)),
			users,
			feedback,
		});
	} catch (error) {
		console.error('Admin overview error:', error);
		res.status(500).json({ message: 'Unable to load admin overview.' });
	}
};

const updateUser = async (req, res) => {
	try {
		if (!['user', 'admin'].includes(req.body.role)) return res.status(400).json({ message: 'A valid role is required.' });
		const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select('-password');
		if (!user) return res.status(404).json({ message: 'User not found.' });
		res.json(user);
	} catch (error) {
		res.status(500).json({ message: 'Unable to update user.' });
	}
};

const deleteUser = async (req, res) => {
	try {
		if (String(req.user.userId) === String(req.params.id)) return res.status(400).json({ message: 'You cannot delete your own account.' });
		const user = await User.findByIdAndDelete(req.params.id);
		if (!user) return res.status(404).json({ message: 'User not found.' });
		await Promise.all([
			Transaction.deleteMany({ user: user._id }), Habit.deleteMany({ user: user._id }),
			Goal.deleteMany({ user: user._id }), Feedback.deleteMany({ user: user._id }),
		]);
		res.json({ message: 'User deleted.' });
	} catch (error) {
		res.status(500).json({ message: 'Unable to delete user.' });
	}
};

const updateFeedback = async (req, res) => {
	try {
		if (!['open', 'in_progress', 'resolved'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid feedback status.' });
		const feedback = await Feedback.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).populate('user', 'name email');
		if (!feedback) return res.status(404).json({ message: 'Feedback not found.' });
		res.json(feedback);
	} catch (error) {
		res.status(500).json({ message: 'Unable to update feedback.' });
	}
};

module.exports = { getOverview, updateUser, deleteUser, updateFeedback };
