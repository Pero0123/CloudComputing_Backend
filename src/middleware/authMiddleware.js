const jwt = require('jsonwebtoken');
const User = require('../models/User');

//verify JWT and attach user to req.user
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'not authorised, no token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //attach user without password hash
    req.user = await User.findById(decoded.id).select('-passwordHash');
    if (!req.user) {
      return res.status(401).json({ message: 'user no longer exists' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'tot authorised, invalid token' });
  }
};

//must come after protect. ensures the user is an admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'admin access required' });
};

module.exports = { protect, adminOnly };
