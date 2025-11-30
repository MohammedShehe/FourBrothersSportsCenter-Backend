// controllers/customerController.js
const pool = require('../config/database');
const { body, validationResult } = require('express-validator');
const {
  generateOTP,
  sendOtpToNumber,
  sendOtpToEmail,
  otpExpireMinutes
} = require('../utils/otp');

const { normalizeTanzaniaNumber, sendOTPSMS } = require('../utils/helpers');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../middleware/customerAuth');
const dotenv = require('dotenv');
dotenv.config();

// ---------------------- VALIDATORS ----------------------
const registerValidators = [
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('gender')
    .trim()
    .isIn(['mwanaume', 'mwanamke', 'nyengine'])
    .withMessage('Gender must be mwanaume, mwanamke or nyengine'),
  body('email').optional().isEmail().withMessage('Invalid email')
];

// ---------------------- REGISTER CUSTOMER ----------------------
async function registerCustomer(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { first_name, last_name, phone, email, address, gender } = req.body;

    const [existing] = await pool.execute('SELECT id FROM customers WHERE phone = ?', [phone]);
    if (existing.length > 0) return res.status(409).json({ message: 'Phone already registered' });

    const [result] = await pool.execute(
      `INSERT INTO customers (first_name, last_name, phone, email, address, gender)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, phone, email || null, address || null, gender]
    );

    const [rows] = await pool.execute(
      'SELECT id, first_name, last_name, phone, email, address, gender, created_at FROM customers WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({ message: 'Customer registered', customer: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ---------------------- SEND OTP ----------------------
async function sendOtp(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone is required' });

    // Normalize to +255 format
    const normalizedPhone = normalizeTanzaniaNumber(phone);

    // Check customer exists (match against raw phone stored in DB)
    const [custRows] = await pool.execute('SELECT id FROM customers WHERE phone = ?', [phone]);
    if (custRows.length === 0) {
      return res.status(404).json({ message: 'Phone not registered.' });
    }

    const customerId = custRows[0].id;

    // Invalidate previous OTPs
    await pool.execute("UPDATE customer_otps SET used=1 WHERE customer_id=? AND used=0", [customerId]);

    // Generate new OTP
    const otp = generateOTP();

    // Save OTP with normalized phone
    await pool.execute(
      `INSERT INTO customer_otps (customer_id, phone, otp, expires_at, used) 
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), 0)`,
      [customerId, normalizedPhone, otp, otpExpireMinutes]
    );

    // Send OTP via Twilio
    const sendRes = await sendOTPSMS(normalizedPhone, otp);
    if (!sendRes.success) {
      return res.status(500).json({ message: 'Failed to send OTP', error: sendRes.error });
    }

    return res.status(200).json({ message: 'OTP sent. It expires shortly.' });
  } catch (err) {
    console.error("Customer Send OTP Error:", err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ---------------------- VERIFY OTP ----------------------
async function verifyOtp(req, res) {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: 'Phone and otp required' });

    const [rows] = await pool.execute(
      `SELECT * FROM customer_otps WHERE phone = ? AND used = 0 AND expires_at >= NOW() ORDER BY created_at DESC LIMIT 1`,
      [phone]
    );
    if (rows.length === 0) return res.status(400).json({ message: 'No valid OTP found or it expired' });

    const record = rows[0];
    if (record.otp !== String(otp).trim()) return res.status(400).json({ message: 'Invalid OTP' });

    await pool.execute('UPDATE customer_otps SET used = 1 WHERE id = ?', [record.id]);

    const [custRows] = await pool.execute(
      'SELECT id, first_name, last_name, phone, email, address, gender FROM customers WHERE phone = ?',
      [phone]
    );
    if (custRows.length === 0) return res.status(404).json({ message: 'Customer not found' });

    const customer = custRows[0];

    const accessToken = generateAccessToken({ id: customer.id, phone: customer.phone });
    const refreshToken = generateRefreshToken({ id: customer.id, phone: customer.phone });

    return res.status(200).json({ message: 'OTP verified', accessToken, refreshToken, customer });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ---------------------- REFRESH TOKEN ----------------------
async function refreshToken(req, res) {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(401).json({ message: 'No refresh token provided' });

    const decoded = verifyRefreshToken(token);
    if (!decoded) return res.status(401).json({ message: 'Invalid or expired refresh token' });

    const newAccessToken = generateAccessToken({ id: decoded.id, phone: decoded.phone });
    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ---------------------- GET CUSTOMER PROFILE ----------------------
async function getCustomerProfile(req, res) {
  try {
    const id = req.user.id;
    const [rows] = await pool.execute(
      'SELECT id, first_name, last_name, phone, email, address, gender, created_at FROM customers WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Customer not found' });
    return res.json({ customer: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ---------------------- UPDATE PROFILE ----------------------
async function updateProfile(req, res) {
  try {
    const id = req.user.id;
    const { first_name, last_name, address, gender, new_phone, new_email } = req.body;

    const [custRows] = await pool.execute('SELECT * FROM customers WHERE id = ?', [id]);
    if (custRows.length === 0) return res.status(404).json({ message: 'Customer not found' });

    const customer = custRows[0];

    if (new_phone && new_phone !== customer.phone)
      return res.status(403).json({ message: 'Phone change requires OTP verification' });
    if (new_email && new_email !== customer.email)
      return res.status(403).json({ message: 'Email change requires OTP verification' });

    await pool.execute(
      `UPDATE customers SET first_name=?, last_name=?, address=?, gender=? WHERE id=?`,
      [
        first_name || customer.first_name,
        last_name || customer.last_name,
        address || customer.address,
        gender || customer.gender,
        id
      ]
    );

    const [updated] = await pool.execute(
      'SELECT id, first_name, last_name, phone, email, address, gender FROM customers WHERE id = ?',
      [id]
    );

    return res.json({ message: 'Profile updated', customer: updated[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ---------------------- REQUEST CHANGE OTP ----------------------
async function requestChangeOtp(req, res) {
  try {
    const id = req.user.id;
    const { type } = req.body; // 'phone' or 'email'

    const [custRows] = await pool.execute('SELECT * FROM customers WHERE id = ?', [id]);
    if (custRows.length === 0) return res.status(404).json({ message: 'Customer not found' });
    const customer = custRows[0];

    const otp = generateOTP();

    if (type === 'phone') {
      await pool.execute(
        `INSERT INTO customer_otps (customer_id, phone, otp, expires_at, used) 
         VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), 0)`,
        [id, customer.phone, otp, otpExpireMinutes]
      );
      await sendOtpToNumber(customer.phone, otp);
    } else if (type === 'email') {
      await sendOtpToEmail(customer.email, otp);
    } else return res.status(400).json({ message: 'Invalid type. Use phone or email' });

    return res.json({ message: `OTP sent to your current ${type}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ---------------------- CONFIRM CHANGE ----------------------
async function confirmChange(req, res) {
  try {
    const id = req.user.id;
    const { otp, new_phone, new_email } = req.body;

    const [custRows] = await pool.execute('SELECT * FROM customers WHERE id = ?', [id]);
    if (custRows.length === 0) return res.status(404).json({ message: 'Customer not found' });

    const customer = custRows[0];

    if (new_phone) {
      const [rows] = await pool.execute(
        `SELECT * FROM customer_otps WHERE phone = ? AND used = 0 AND expires_at >= NOW() ORDER BY created_at DESC LIMIT 1`,
        [customer.phone]
      );
      if (rows.length === 0 || rows[0].otp !== String(otp).trim())
        return res.status(400).json({ message: 'Invalid or expired OTP' });

      await pool.execute('UPDATE customer_otps SET used = 1 WHERE id=?', [rows[0].id]);
      await pool.execute('UPDATE customers SET phone=? WHERE id=?', [new_phone, id]);
    }

    if (new_email) {
      await pool.execute('UPDATE customers SET email=? WHERE id=?', [new_email, id]);
    }

    const [updated] = await pool.execute(
      'SELECT id, first_name, last_name, phone, email, address, gender FROM customers WHERE id=?',
      [id]
    );
    return res.json({ message: 'Profile updated', customer: updated[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ---------------------- CUSTOMER: GET ADS ----------------------
async function getAds(req, res) {
  try {
    const [ads] = await pool.execute(
      'SELECT id, image_url, link, created_at FROM ads ORDER BY created_at DESC'
    );
    return res.json({ ads });
  } catch (err) {
    console.error('Get Ads Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ---------------------- GET ANNOUNCEMENTS ----------------------
async function getAnnouncements(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, content AS message, type, created_at
       FROM admin_notifications
       WHERE type = 'announcement'
       ORDER BY created_at DESC
       LIMIT 1`
    );

    if (rows.length === 0) return res.json({ announcement: null });
    return res.json({ announcement: rows[0] });
  } catch (err) {
    console.error('Get Announcements Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ---------------------- GET ALL PRODUCTS ----------------------
async function getAllProducts(req, res) {
  try {
    const [products] = await pool.execute(
      `SELECT id, name, company, color, discount_percent, type, size_us, stock, price, created_at
       FROM products ORDER BY created_at DESC`
    );

    for (let product of products) {
      const [images] = await pool.execute(
        'SELECT image_url FROM product_images WHERE product_id = ? ORDER BY id',
        [product.id]
      );
      product.images = images.map(img => img.image_url);

      if (product.discount_percent && product.discount_percent > 0) {
        const discount = (product.price * product.discount_percent) / 100;
        product.final_price = product.price - discount;
      } else {
        product.final_price = product.price;
      }
    }

    res.json(products);
  } catch (err) {
    console.error('Customer Get Products Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// ---------------------- GET PRODUCT BY ID ----------------------
async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT id, name, company, color, discount_percent, type, size_us, stock, price, created_at
       FROM products WHERE id=?`,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ message: 'Product not found' });

    const product = rows[0];
    const [images] = await pool.execute(
      'SELECT image_url FROM product_images WHERE product_id = ? ORDER BY id',
      [id]
    );
    product.images = images.map(img => img.image_url);

    if (product.discount_percent && product.discount_percent > 0) {
      const discount = (product.price * product.discount_percent) / 100;
      product.final_price = product.price - discount;
    } else {
      product.final_price = product.price;
    }

    res.json(product);
  } catch (err) {
    console.error('Customer Get Product Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// ---------------------- PLACE ORDER ----------------------
async function placeOrder(req, res) {
  try {
    const customer_id = req.user.id;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: 'Order items required' });

    let totalAmount = 0;
    const orderItemsData = [];

    for (let item of items) {
      const { product_id, quantity } = item;
      if (!product_id || !quantity || quantity < 1)
        return res.status(400).json({ message: 'Invalid product or quantity' });

      const [products] = await pool.execute(
        'SELECT price, stock, discount_percent FROM products WHERE id = ?',
        [product_id]
      );
      if (products.length === 0) return res.status(404).json({ message: `Product ${product_id} not found` });

      const product = products[0];
      if (product.stock < quantity)
        return res.status(400).json({ message: `Insufficient stock for product ${product_id}` });

      const discountPercent = product.discount_percent || 0;
      const unitPrice = product.price * (1 - discountPercent / 100);
      const lineTotal = unitPrice * quantity;

      totalAmount += lineTotal;

      orderItemsData.push({ product_id, quantity, unit_price: unitPrice, line_total: lineTotal });
    }

    if (items.length >= 3) totalAmount *= 0.9; // cart-level discount

    const [orderResult] = await pool.execute(
      'INSERT INTO orders (customer_id, total_price, status) VALUES (?, ?, ?)',
      [customer_id, totalAmount, 'Imewekwa']
    );

    const order_id = orderResult.insertId;

    for (let item of orderItemsData) {
      await pool.execute(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)',
        [order_id, item.product_id, item.quantity, item.unit_price, item.line_total]
      );
      await pool.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    res.status(201).json({ message: 'Order placed successfully', order_id, total_price: totalAmount, status: 'Imewekwa' });
  } catch (err) {
    console.error('Place Order Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// ---------------------- GET CUSTOMER ORDERS ----------------------
async function getCustomerOrders(req, res) {
  try {
    const customerId = req.user.id;
    const [orders] = await pool.execute(
      `SELECT o.id, o.status, o.total_price, o.created_at
       FROM orders o
       WHERE o.customer_id = ?
       ORDER BY o.created_at DESC`,
      [customerId]
    );
    res.json({ orders });
  } catch (err) {
    console.error("Get Customer Orders Error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// ---------------------- CANCEL ORDER ----------------------
async function cancelOrder(req, res) {
  try {
    const customerId = req.user.id;
    const { order_id } = req.params;
    const { reason } = req.body;

    if (!reason) return res.status(400).json({ message: "Cancellation reason is required" });

    const [orders] = await pool.execute(
      'SELECT status FROM orders WHERE id = ? AND customer_id = ?',
      [order_id, customerId]
    );
    if (orders.length === 0) return res.status(404).json({ message: "Order not found" });

    if (orders[0].status !== 'Imewekwa') return res.status(400).json({ message: "Only orders with status 'Imewekwa' can be cancelled" });

    await pool.execute('UPDATE orders SET status="Ghairishwa" WHERE id=?', [order_id]);

    const message = `Order id ${order_id} imeghairishwa kwasababu ${reason}`;
    await pool.execute('INSERT INTO customer_notifications (customer_id, message) VALUES (?, ?)', [customerId, message]);

    res.json({ message: "Order cancelled successfully" });
  } catch (err) {
    console.error("Cancel Order Error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// ---------------------- RETURN ORDER ----------------------
async function returnOrder(req, res) {
  try {
    const customerId = req.user.id;
    const { order_id } = req.params;
    const { reason, productCondition } = req.body;

    if (!reason) return res.status(400).json({ message: "Return reason is required" });
    
    if (!productCondition.originalPackaging || !productCondition.tagsAttached || !productCondition.notUsed) {
        return res.status(400).json({ message: "Product must be in original packaging, tags attached, and unused." });
    }

    const [orders] = await pool.execute(
      'SELECT status, created_at FROM orders WHERE id=? AND customer_id=?',
      [order_id, customerId]
    );
    if (orders.length === 0) return res.status(404).json({ message: "Order not found" });

    const order = orders[0];
    if (order.status !== 'Imepokelewa') return res.status(400).json({ message: "Bidhaa Uliyopokea tu ndio utaweza kurudisha" });

    const diffDays = Math.floor((new Date() - new Date(order.created_at)) / (1000 * 60 * 60 * 24));
    if (diffDays > 3) return res.status(400).json({ message: "Return period (3 days) has expired" });

    await pool.execute('UPDATE orders SET status="Kurudishwa" WHERE id=?', [order_id]);

    const message = `Order id ${order_id} inaombwa kurudishwa kwasababu ${reason}`;
    await pool.execute(
      'INSERT INTO customer_notifications (customer_id, message) VALUES (?, ?)',
      [customerId, message]
    );

    res.json({ message: "Order return requested successfully" });
  } catch (err) {
    console.error("Return Order Error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// ---------------------- RATE ORDER ----------------------
async function rateOrder(req, res) {
  try {
    const customerId = req.user.id;
    const { order_id } = req.params;
    const { package_rating, delivery_rating, product_rating, overall_comment } = req.body;

    if (![package_rating, delivery_rating, product_rating].every(r => r >= 1 && r <= 5)) {
      return res.status(400).json({ message: "Ratings must be between 1 and 5" });
    }

    const [orders] = await pool.execute(
      'SELECT status FROM orders WHERE id=? AND customer_id=?',
      [order_id, customerId]
    );
    if (orders.length === 0) return res.status(404).json({ message: "Order not found" });
    if (orders[0].status !== 'Imepokelewa') return res.status(400).json({ message: "Only received orders can be rated" });

    await pool.execute(
      `INSERT INTO order_ratings (order_id, customer_id, package_rating, delivery_rating, product_rating, overall_comment)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          package_rating = VALUES(package_rating),
          delivery_rating = VALUES(delivery_rating),
          product_rating = VALUES(product_rating),
          overall_comment = VALUES(overall_comment),
          updated_at = CURRENT_TIMESTAMP;`,
      [order_id, customerId, package_rating, delivery_rating, product_rating, overall_comment]
    );

    res.json({ message: "Order rated successfully" });
  } catch (err) {
    console.error("Rate Order Error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// ---------------------- GET PRODUCT RATINGS ----------------------
async function getProductRatings(req, res) {
  try {
    const [ratings] = await pool.execute(
      `SELECT p.id AS product_id, p.name, 
              AVG(r.product_rating) AS avg_rating, 
              COUNT(r.product_rating) AS total_ratings
       FROM products p
       LEFT JOIN order_items oi ON oi.product_id = p.id
       LEFT JOIN order_ratings r ON r.order_id = oi.order_id
       GROUP BY p.id`
    );

    res.json({ ratings });
  } catch (err) {
    console.error("Get Product Ratings Error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// ---------------------- CUSTOMER MESSAGES ----------------------
async function sendCustomerMessage(req, res) {
  try {
    const customer_id = req.user.id;
    const { message } = req.body;

    if (!message)
      return res.status(400).json({ message: ' Ujumbe Unahitajika!' });

    const [result] = await pool.execute(
      'INSERT INTO customer_notifications (customer_id, message) VALUES (?, ?)',
      [customer_id, message]
    );

    return res.status(201).json({ message: 'Message imetumwa', id: result.insertId });
  } catch (err) {
    console.error("Send Message Error:", err);
    return res.status(500).json({ message: 'Server error' });
  }
}


module.exports = {
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
};
