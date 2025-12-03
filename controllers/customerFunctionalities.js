const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // ADD THIS IMPORT
const { body, validationResult } = require('express-validator');
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
  body('password').trim().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirm_password').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
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

    const { first_name, last_name, phone, email, address, gender, password } = req.body;

    const [existing] = await pool.execute('SELECT id FROM customers WHERE phone = ?', [phone]);
    if (existing.length > 0) return res.status(409).json({ message: 'Phone already registered' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      `INSERT INTO customers (first_name, last_name, phone, email, address, gender, password)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, phone, email || null, address || null, gender, hashedPassword]
    );

    const [rows] = await pool.execute(
      'SELECT id, first_name, last_name, phone, email, address, gender, created_at FROM customers WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({ message: 'Customer registered successfully', customer: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ---------------------- LOGIN CUSTOMER ----------------------
async function loginCustomer(req, res) {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required' });
    }

    // Check customer exists
    const [custRows] = await pool.execute(
      'SELECT * FROM customers WHERE phone = ?',
      [phone]
    );
    if (custRows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const customer = custRows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const accessToken = generateAccessToken({ id: customer.id, phone: customer.phone });
    const refreshToken = generateRefreshToken({ id: customer.id, phone: customer.phone });

    return res.status(200).json({ 
      message: 'Login successful', 
      accessToken, 
      refreshToken, 
      customer: {
        id: customer.id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        gender: customer.gender
      }
    });
  } catch (err) {
    console.error("Customer Login Error:", err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ---------------------- REQUEST PASSWORD RESET ----------------------
async function requestPasswordReset(req, res) {
  try {
    const { first_name, last_name } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({ message: 'First name and last name are required' });
    }

    const [custRows] = await pool.execute(
      'SELECT * FROM customers WHERE first_name = ? AND last_name = ?',
      [first_name, last_name]
    );

    if (custRows.length === 0) {
      return res.status(404).json({ message: 'Customer not found with these details' });
    }

    const customer = custRows[0];

    // Generate reset token (simple JWT)
    const resetToken = jwt.sign(
      { id: customer.id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Save reset token to database
    await pool.execute(
      'UPDATE customers SET reset_token=?, reset_token_expires=DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id=?',
      [resetToken, customer.id]
    );

    return res.json({ 
      message: 'Password reset authorized', 
      reset_token: resetToken,
      next_step: 'Use this token to reset your password' 
    });
  } catch (err) {
    console.error("Request Password Reset Error:", err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ---------------------- RESET PASSWORD ----------------------
async function resetPassword(req, res) {
  try {
    const { reset_token, new_password, confirm_password } = req.body;

    if (!reset_token || !new_password || !confirm_password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Verify reset token and check expiration
    const [custRows] = await pool.execute(
      'SELECT * FROM customers WHERE reset_token=? AND reset_token_expires > NOW()',
      [reset_token]
    );

    if (custRows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const customer = custRows[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password and clear reset token
    await pool.execute(
      'UPDATE customers SET password=?, reset_token=NULL, reset_token_expires=NULL WHERE id=?',
      [hashedPassword, customer.id]
    );

    return res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ---------------------- CHANGE MOBILE NUMBER ----------------------
async function changeMobile(req, res) {
  try {
    const { first_name, last_name, new_mobile, confirm_mobile } = req.body;

    if (!first_name || !last_name || !new_mobile || !confirm_mobile) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (new_mobile !== confirm_mobile) {
      return res.status(400).json({ message: 'Mobile numbers do not match' });
    }

    const [custRows] = await pool.execute(
      'SELECT * FROM customers WHERE first_name = ? AND last_name = ?',
      [first_name, last_name]
    );

    if (custRows.length === 0) {
      return res.status(404).json({ message: 'Customer not found with these details' });
    }

    const customer = custRows[0];

    // Check if new mobile is already taken
    const [existing] = await pool.execute(
      'SELECT id FROM customers WHERE phone=? AND id!=?',
      [new_mobile, customer.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Mobile number already in use' });
    }

    // Update mobile number
    await pool.execute(
      'UPDATE customers SET phone=? WHERE id=?',
      [new_mobile, customer.id]
    );

    return res.json({ message: 'Mobile number updated successfully. You can now login with your new mobile number.' });
  } catch (err) {
    console.error("Change Mobile Error:", err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ---------------------- VERIFY PASSWORD FOR ORDER CONFIRMATION ----------------------
async function verifyPasswordForOrder(req, res) {
  try {
    const customerId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Get customer
    const [custRows] = await pool.execute(
      'SELECT password FROM customers WHERE id = ?',
      [customerId]
    );

    if (custRows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const customer = custRows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    return res.json({ message: 'Password verified successfully' });
  } catch (err) {
    console.error("Verify Password Error:", err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ---------------------- UPDATE ORDER STATUS WITH PASSWORD VERIFICATION ----------------------
async function confirmOrderReception(req, res) {
  try {
    const { order_id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required to confirm order reception" });
    }

    const customerId = req.user.id;

    // Verify customer password
    const [custRows] = await pool.execute(
      'SELECT password FROM customers WHERE id = ?',
      [customerId]
    );

    if (custRows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const customer = custRows[0];
    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Check order status
    const [orders] = await pool.execute(
      "SELECT status FROM orders WHERE id=? AND customer_id=?",
      [order_id, customerId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orders[0];

    if (order.status !== 'Inasafirishwa') {
      return res.status(400).json({ message: "Order is not ready to be marked as received" });
    }

    // Update order status to received
    await pool.execute(
      "UPDATE orders SET status='Imepokelewa' WHERE id=?",
      [order_id]
    );

    return res.json({ message: "Order reception confirmed successfully" });
  } catch (err) {
    console.error("Confirm Order Reception Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}


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

async function updateProfile(req, res) {
  try {
    const id = req.user.id;
    const { first_name, last_name, address, gender, new_phone, new_email, current_password } = req.body;

    const [custRows] = await pool.execute('SELECT * FROM customers WHERE id = ?', [id]);
    if (custRows.length === 0) return res.status(404).json({ message: 'Customer not found' });

    const customer = custRows[0];

    // Verify current password for sensitive changes
    if (new_phone || new_email) {
      if (!current_password) {
        return res.status(400).json({ message: 'Current password is required for this change' });
      }
      
      const isPasswordValid = await bcrypt.compare(current_password, customer.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid current password' });
      }
    }

    if (new_phone && new_phone !== customer.phone) {
      // Check if new phone is already taken
      const [existing] = await pool.execute('SELECT id FROM customers WHERE phone = ? AND id != ?', [new_phone, id]);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Phone number already in use' });
      }
      await pool.execute('UPDATE customers SET phone = ? WHERE id = ?', [new_phone, id]);
    }

    if (new_email && new_email !== customer.email) {
      await pool.execute('UPDATE customers SET email = ? WHERE id = ?', [new_email, id]);
    }

    // Update basic info
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

// Remove OTP-related functions and replace with password verification
async function changeEmail(req, res) {
  try {
    const id = req.user.id;
    const { new_email, current_password } = req.body;

    if (!new_email || !current_password) {
      return res.status(400).json({ message: 'New email and current password are required' });
    }

    const [custRows] = await pool.execute('SELECT * FROM customers WHERE id = ?', [id]);
    if (custRows.length === 0) return res.status(404).json({ message: 'Customer not found' });

    const customer = custRows[0];

    // Verify current password
    const isPasswordValid = await bcrypt.compare(current_password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid current password' });
    }

    // Update email
    await pool.execute('UPDATE customers SET email = ? WHERE id = ?', [new_email, id]);

    const [updated] = await pool.execute(
      'SELECT id, first_name, last_name, phone, email, address, gender FROM customers WHERE id = ?',
      [id]
    );

    return res.json({ message: 'Email updated successfully', customer: updated[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function changePhone(req, res) {
  try {
    const id = req.user.id;
    const { new_phone, current_password } = req.body;

    if (!new_phone || !current_password) {
      return res.status(400).json({ message: 'New phone and current password are required' });
    }

    const [custRows] = await pool.execute('SELECT * FROM customers WHERE id = ?', [id]);
    if (custRows.length === 0) return res.status(404).json({ message: 'Customer not found' });

    const customer = custRows[0];

    // Verify current password
    const isPasswordValid = await bcrypt.compare(current_password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid current password' });
    }

    // Check if new phone is already taken
    const [existing] = await pool.execute('SELECT id FROM customers WHERE phone = ? AND id != ?', [new_phone, id]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Phone number already in use' });
    }

    // Update phone
    await pool.execute('UPDATE customers SET phone = ? WHERE id = ?', [new_phone, id]);

    const [updated] = await pool.execute(
      'SELECT id, first_name, last_name, phone, email, address, gender FROM customers WHERE id = ?',
      [id]
    );

    return res.json({ message: 'Phone number updated successfully', customer: updated[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function changePassword(req, res) {
  try {
    const id = req.user.id;
    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({ message: 'All password fields are required' });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    const [custRows] = await pool.execute('SELECT * FROM customers WHERE id = ?', [id]);
    if (custRows.length === 0) return res.status(404).json({ message: 'Customer not found' });

    const customer = custRows[0];

    // Verify current password
    const isPasswordValid = await bcrypt.compare(current_password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid current password' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await pool.execute('UPDATE customers SET password = ? WHERE id = ?', [hashedPassword, id]);

    return res.json({ message: 'Password changed successfully' });
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


module.exports = {
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
  refreshToken
};
