const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
  let token = req.cookies.jwt_token;

  // Fallback: Check Authorization header (Bearer <token>)
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'wealthpulse_dev_secret');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Session expired or invalid token.' });
    }

    req.user = { ...decoded, userId: decoded.userId, user: user.toObject ? user.toObject() : user };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Session expired or invalid token.' });
  }
};