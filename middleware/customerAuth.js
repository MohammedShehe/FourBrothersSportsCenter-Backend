// middlewares/customerAuth.js
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const ACCESS_SECRET = process.env.JWT_SECRET || 'access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';

/**
 * Middleware to verify access token
 */
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Access token error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

/**
 * Generate a new access token
 * @param {Object} payload - user info
 * @returns {string} JWT access token
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
}

/**
 * Generate a new refresh token
 * @param {Object} payload - user info
 * @returns {string} JWT refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
}

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object|null} Decoded payload or null if invalid
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = {
  authMiddleware,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
};
