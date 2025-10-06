const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const upload = require('../config/multer');

// Import controllers
const adminController = require('../controllers/adminController');
const dashboardController = require('../controllers/dashboardController');
const productController = require('../controllers/productController');
const customerController = require('../controllers/customerController');
const notificationController = require('../controllers/notificationController');

// ---------------- Authentication ----------------
router.post('/login', adminController.login);
router.post('/verify-otp', adminController.verifyOtp);

// ---------------- Dashboard ----------------
router.get('/dashboard/stats', adminAuth, dashboardController.getDashboardStats);

// ---------------- Products ----------------
router.post('/products', adminAuth, upload.array('images', 5), productController.addProduct);
router.get('/products', adminAuth, productController.getProducts);
router.put('/products/:id', adminAuth, upload.array('images', 5), productController.updateProduct);
router.delete('/products/:id', adminAuth, productController.deleteProduct);

// ---------------- Customers ----------------
router.post('/customers', adminAuth, customerController.addCustomer);
router.get('/customers', adminAuth, customerController.getCustomers);
router.put('/customers/:id', adminAuth, customerController.updateCustomer);
router.delete('/customers/:id', adminAuth, customerController.deleteCustomer);

// ---------------- Ads ----------------
router.post('/ads', adminAuth, upload.single('image'), notificationController.postAd);
router.get('/ads', adminAuth, notificationController.getAds);
router.delete('/ads/:id', adminAuth, notificationController.deleteAd);

// ---------------- Notifications ----------------
router.get('/notifications/customer', adminAuth, notificationController.viewCustomerNotifications);
router.post('/notifications/send', adminAuth, notificationController.sendMessage);
router.post('/messages', adminAuth, notificationController.sendInAppMessageOnly);

// ---------------- Orders ----------------
router.get('/orders', adminAuth, notificationController.getAllOrders);

// ✅ Normal status updates (except Imepokelewa)
router.put('/orders/:order_id/status', adminAuth, notificationController.updateOrderStatus);

// ✅ OTP flow for Imepokelewa
router.get('/orders/:order_id/otp', adminAuth, notificationController.getOrderOtp);       // optional for logging/testing
router.post('/orders/:order_id/generate-otp', adminAuth, notificationController.generateOrderOtp); // new: generate OTP & set Imepokelewa_PENDING
router.post('/orders/:order_id/confirm', adminAuth, notificationController.confirmOrderReception); // confirm OTP and finalize status

module.exports = router;
