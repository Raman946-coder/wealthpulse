const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://wealthpulse-two.vercel.app',
  'https://wealthpulse-7s3xbllp3-raman946-coders-projects.vercel.app'
];

app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many authentication attempts. Please try again later.' }
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wealthpulse')
  .then(() => {
    console.log('MongoDB Connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('DB Connection Error:', err));