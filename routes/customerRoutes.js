// routes/customerRoutes.js
const express = require('express');
const router = express.Router();

const {
  registerValidators,
  registerCustomer,
  sendOtp,
  verifyOtp,
  refreshToken,
  getCustomerProfile,
  updateProfile,
  requestChangeOtp,
  confirmChange,
  getAds,
  getAnnouncements,
  getAllProducts,
  getProductById,
  placeOrder,
  getCustomerOrders,
  cancelOrder,
  returnOrder,
  rateOrder,
  getProductRatings,
  sendCustomerMessage
} = require('../controllers/customerFunctionalities');

const { authMiddleware } = require('../middleware/customerAuth');

// ------------------- AUTH -------------------
// Register new customer
router.post('/register', [...registerValidators], registerCustomer);

// Send OTP for login
router.post('/send-otp', sendOtp);

// Verify OTP + return access & refresh token
router.post('/verify-otp', verifyOtp);

// Refresh access token
router.post('/refresh-token', refreshToken);

// ------------------- PROFILE -------------------
// Get profile (JWT required)
router.get('/me', authMiddleware, getCustomerProfile);

// Update profile (basic info only)
router.put('/me/update', authMiddleware, updateProfile);

// Request OTP for phone/email change
router.post('/me/request-change-otp', authMiddleware, requestChangeOtp);

// Confirm phone/email change with OTP
router.post('/me/confirm-change', authMiddleware, confirmChange);

// ------------------- CUSTOMER CONTENT -------------------
// Get ads (public: no auth required)
router.get('/ads', getAds);

// Get in-app announcements (auth required)
router.get('/announcements', authMiddleware, getAnnouncements);

// Get all products (public: no auth required)
router.get('/products', getAllProducts);

// Get single product by ID (optional, public)
router.get('/products/:id', getProductById);

router.post('/send-message', authMiddleware, sendCustomerMessage);

// ------------------- ORDERS -------------------
// Place a new order
router.post('/orders', authMiddleware, placeOrder);

// Get all orders of the logged-in customer
router.get('/orders', authMiddleware, getCustomerOrders);

// Cancel an order (status must be 'Imewekwa')
router.post('/orders/:order_id/cancel', authMiddleware, cancelOrder);

// Request return of an order (within 3 days, status 'Imepokelewa')
router.post('/orders/:order_id/return', authMiddleware, returnOrder);

// Rate an order (status 'Imepokelewa')
router.post('/orders/:order_id/rate', authMiddleware, rateOrder);

// View customer ratings
router.get('/ratings', authMiddleware, getProductRatings);
module.exports = router;
