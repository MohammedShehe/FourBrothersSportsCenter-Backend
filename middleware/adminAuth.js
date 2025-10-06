const jwt = require('jsonwebtoken');
require('dotenv').config();

const adminAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  // Expect header format: "Bearer <token>"
  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET_KEY");
    req.admin = decoded; // { id, role, iat, exp }
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    res.status(400).json({ message: 'Invalid token.' });
  }
};

module.exports = adminAuth;
