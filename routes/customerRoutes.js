const express = require('express');
const router = express.Router();

const {
  registerValidators,
  registerCustomer,
  loginCustomer,
  requestPasswordReset,
  resetPassword,
  changeMobile,
  verifyPasswordForOrder,
  confirmOrderReception,
  getCustomerProfile,
  updateProfile,
  changeEmail,
  changePhone,
  changePassword,
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
  sendCustomerMessage,
  refreshToken // Add this import
} = require('../controllers/customerFunctionalities');

const { authMiddleware } = require('../middleware/customerAuth');

// ------------------- AUTH -------------------
// Register new customer
router.post('/register', [...registerValidators], registerCustomer);

// Login customer
router.post('/login', loginCustomer);

// Refresh token
router.post('/refresh-token', refreshToken); // Add this route

// Password reset flow
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/change-mobile', changeMobile);

// ------------------- PROFILE -------------------
// Get profile (JWT required)
router.get('/me', authMiddleware, getCustomerProfile);

// Update profile
router.put('/me/update', authMiddleware, updateProfile);

// Change email (requires current password)
router.post('/me/change-email', authMiddleware, changeEmail);

// Change phone (requires current password)
router.post('/me/change-phone', authMiddleware, changePhone);

// Change password (requires current password)
router.post('/me/change-password', authMiddleware, changePassword);

// ------------------- CUSTOMER CONTENT -------------------
// Get ads (public: no auth required)
router.get('/ads', getAds);

// Get in-app announcements (auth required)
router.get('/announcements', authMiddleware, getAnnouncements);

// Get all products (public: no auth required)
router.get('/products', getAllProducts);

// Get single product by ID (optional, public)
router.get('/products/:id', getProductById);

// Send message to admin
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

// Verify password for order confirmation
router.post('/verify-password', authMiddleware, verifyPasswordForOrder);

// Confirm order reception with password (replaces OTP confirmation)
router.post('/orders/:order_id/confirm', authMiddleware, confirmOrderReception);

// View customer ratings
router.get('/ratings', authMiddleware, getProductRatings);

module.exports = router;