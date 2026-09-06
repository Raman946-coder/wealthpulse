const express = require('express');
const protect = require('../middleware/authMiddleware');
const Feedback = require('../models/Feedback');

const router = express.Router();
const getUserId = (req) => req.user?.userId || req.user?.id || req.user?._id;

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const feedback = await Feedback.find({ user: getUserId(req) }).sort({ createdAt: -1 });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load feedback.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject?.trim() || !message?.trim()) return res.status(400).json({ message: 'Subject and message are required.' });
    const feedback = await Feedback.create({ user: getUserId(req), subject: subject.trim(), message: message.trim() });
    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Unable to submit feedback.' });
  }
});

module.exports = router;
