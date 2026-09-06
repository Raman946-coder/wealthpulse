const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many authentication attempts. Please try again in 15 minutes.' },
});

const sendTokenCookie = (user, res, statusCode, message) => {
  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || 'wealthpulse_dev_secret',
    { expiresIn: '1d' }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  };

  res.cookie('jwt_token', token, cookieOptions);

  res.status(statusCode).json({
    message,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isProfileComplete: user.isProfileComplete || false,
      financialProfile: user.financialProfile || {},
    },
    token,
  });
};

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email address is already registered.' });
    }

    // Hash password before creating user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'user',
      isProfileComplete: false,
    });
    await newUser.save();

    sendTokenCookie(newUser, res, 201, 'Registration successful.');
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password, role = 'user' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Direct bcrypt comparison without calling missing schema method
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.role !== role) {
      const expectedRole = user.role === 'admin' ? 'administrator' : 'user';
      const selectedRole = role === 'admin' ? 'administrator' : 'user';
      return res.status(403).json({
        message: `These credentials belong to a ${expectedRole}. You cannot sign in as a ${selectedRole}.`,
      });
    }

    sendTokenCookie(user, res, 200, 'Login successful.');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

router.post('/onboarding', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const { contactDetails, financialGoals, financialActivityHistory } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.financialProfile = {
      contactDetails: contactDetails || '',
      financialGoals: financialGoals || '',
      financialActivityHistory: financialActivityHistory || '',
    };
    user.isProfileComplete = true;

    await user.save();

    res.json({
      message: 'Onboarding completed successfully.',
      isProfileComplete: user.isProfileComplete,
      financialProfile: user.financialProfile,
    });
  } catch (err) {
    console.error('Onboarding error:', err);
    res.status(500).json({ message: 'Server error saving onboarding profile.' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isProfileComplete: user.isProfileComplete || false,
        financialProfile: user.financialProfile || {},
      },
    });
  } catch (err) {
    console.error('Session retrieval error:', err);
    res.status(500).json({ message: 'Error retrieving user state.' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('jwt_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.json({ message: 'Logged out successfully.' });
});

module.exports = router;