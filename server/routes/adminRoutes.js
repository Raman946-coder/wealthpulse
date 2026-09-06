const express = require('express');
const protect = require('../middleware/authMiddleware');
const { getOverview, updateUser, deleteUser, updateFeedback } = require('../controllers/adminController');

const router = express.Router();

const adminOnly = (req, res, next) => {
	if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
	next();
};

router.use(protect, adminOnly);
router.get('/overview', getOverview);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/feedback/:id', updateFeedback);

module.exports = router;
