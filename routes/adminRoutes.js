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
router.post('/login', adminController.adminLogin);
router.post('/forgot-password', adminController.forgotPassword);
router.post('/reset-password', adminController.resetPassword);
router.post('/change-mobile', adminController.changeMobile);

// ---------------- Admin Management (Only by main admin) ----------------
router.post('/admins', adminAuth, adminController.addAdmin);
router.get('/admins', adminAuth, adminController.getAdmins);
router.put('/admins/:id', adminAuth, adminController.updateAdmin);
router.delete('/admins/:id', adminAuth, adminController.deleteAdmin);

// ---------------- Dashboard ----------------
router.get('/dashboard/stats', adminAuth, dashboardController.getDashboardStats);

// ---------------- Products ----------------
router.post('/products', adminAuth, upload.array('images', 5), productController.addProduct);
router.get('/products', adminAuth, productController.getProducts);
router.put('/products/:id', adminAuth, upload.array('images', 5), productController.updateProduct);
router.delete('/products/:id', adminAuth, productController.deleteProduct);
router.get('/products/:id', adminAuth, productController.getProductById);

// Product size management
router.get('/products/:product_id/sizes', adminAuth, productController.getProductSizes);
router.put('/sizes/:size_id/stock', adminAuth, productController.updateSizeStock);

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
router.get('/notifications/unread-counts', adminAuth, notificationController.getUnreadCounts);
router.put('/notifications/mark-read/:notification_id', adminAuth, notificationController.markCustomerNotificationRead);
router.put('/notifications/mark-all-read', adminAuth, notificationController.markAllNotificationsAsRead);
router.get('/announcements', adminAuth, notificationController.getAnnouncements);

// ---------------- Orders ----------------
router.get('/orders', adminAuth, notificationController.getAllOrders); // Changed back to getAllOrders
router.put('/orders/:order_id/status', adminAuth, notificationController.updateOrderStatus);
router.put('/orders/mark-viewed/:order_id', adminAuth, notificationController.markOrderViewed);
router.put('/orders/mark-all-viewed', adminAuth, notificationController.markAllOrdersAsViewed);

module.exports = router;