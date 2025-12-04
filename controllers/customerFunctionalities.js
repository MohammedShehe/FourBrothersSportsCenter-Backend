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
  body('first_name').trim().notEmpty().withMessage('Jina la kwanza linahitajika'),
  body('last_name').trim().notEmpty().withMessage('Jina la familia linahitajika'),
  body('phone').trim().notEmpty().withMessage('Nambari ya simu inahitajika'),
  body('password').trim().isLength({ min: 6 }).withMessage('Nenosiri lazima liwe na herufi 6 au zaidi'),
  body('confirm_password').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Nenosiri halifanani');
    }
    return true;
  }),
  body('gender')
    .trim()
    .isIn(['mwanaume', 'mwanamke', 'nyengine'])
    .withMessage('Jinsia lazima iwe mwanaume, mwanamke au nyengine'),
  body('email').optional().isEmail().withMessage('Barua pepe si sahihi')
];

// ---------------------- REGISTER CUSTOMER ----------------------
async function registerCustomer(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { first_name, last_name, phone, email, address, gender, password } = req.body;

    const [existing] = await pool.execute('SELECT id FROM customers WHERE phone = ?', [phone]);
    if (existing.length > 0) return res.status(409).json({ message: 'Nambari ya simu tayari imesajiliwa' });

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

    return res.status(201).json({ message: 'Mteja amesajiliwa kikamilifu', customer: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Hitilafu ya seva' });
  }
}

// ---------------------- LOGIN CUSTOMER ----------------------
async function loginCustomer(req, res) {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Nambari ya simu na nenosiri vinahitajika' });
    }

    // Check customer exists
    const [custRows] = await pool.execute(
      'SELECT * FROM customers WHERE phone = ?',
      [phone]
    );
    if (custRows.length === 0) {
      return res.status(404).json({ message: 'Mteja hajapatikana' });
    }

    const customer = custRows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Nenosiri si sahihi' });
    }

    const accessToken = generateAccessToken({ id: customer.id, phone: customer.phone });
    const refreshToken = generateRefreshToken({ id: customer.id, phone: customer.phone });

    return res.status(200).json({ 
      message: 'Ingia imefanikiwa', 
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
    return res.status(500).json({ message: 'Hitilafu ya seva' });
  }
}

// ---------------------- REQUEST PASSWORD RESET ----------------------
async function requestPasswordReset(req, res) {
  try {
    const { first_name, last_name } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({ message: 'Jina la kwanza na jina la familia vinahitajika' });
    }

    const [custRows] = await pool.execute(
      'SELECT * FROM customers WHERE first_name = ? AND last_name = ?',
      [first_name, last_name]
    );

    if (custRows.length === 0) {
      return res.status(404).json({ message: 'Mteja hajapatikana kwa maelezo haya' });
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
      message: 'Kubadilisha nenosiri kumeidhinishwa', 
      reset_token: resetToken,
      next_step: 'Tumia tokeni hii kubadilisha nenosiri lako' 
    });
  } catch (err) {
    console.error("Request Password Reset Error:", err);
    return res.status(500).json({ message: 'Hitilafu ya seva' });
  }
}

// ---------------------- RESET PASSWORD ----------------------
async function resetPassword(req, res) {
  try {
    const { reset_token, new_password, confirm_password } = req.body;

    if (!reset_token || !new_password || !confirm_password) {
      return res.status(400).json({ message: 'Sehemu zote zinahitajika' });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ message: 'Nenosiri halifanani' });
    }

    // Verify reset token and check expiration
    const [custRows] = await pool.execute(
      'SELECT * FROM customers WHERE reset_token=? AND reset_token_expires > NOW()',
      [reset_token]
    );

    if (custRows.length === 0) {
      return res.status(400).json({ message: 'Tokeni ya kubadilisha nenosiri si sahihi au imeisha muda wake' });
    }

    const customer = custRows[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password and clear reset token
    await pool.execute(
      'UPDATE customers SET password=?, reset_token=NULL, reset_token_expires=NULL WHERE id=?',
      [hashedPassword, customer.id]
    );

    return res.json({ message: 'Nenosiri limebadilishwa kikamilifu. Unaweza kuingia sasa kwa nenosiri jipya.' });
  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({ message: 'Hitilafu ya seva' });
  }
}

// ---------------------- CHANGE MOBILE NUMBER ----------------------
async function changeMobile(req, res) {
  try {
    const { first_name, last_name, new_mobile, confirm_mobile } = req.body;

    if (!first_name || !last_name || !new_mobile || !confirm_mobile) {
      return res.status(400).json({ message: 'Sehemu zote zinahitajika' });
    }

    if (new_mobile !== confirm_mobile) {
      return res.status(400).json({ message: 'Nambari za simu hazifanani' });
    }

    const [custRows] = await pool.execute(
      'SELECT * FROM customers WHERE first_name = ? AND last_name = ?',
      [first_name, last_name]
    );

    if (custRows.length === 0) {
      return res.status(404).json({ message: 'Mteja hajapatikana kwa maelezo haya' });
    }

    const customer = custRows[0];

    // Check if new mobile is already taken
    const [existing] = await pool.execute(
      'SELECT id FROM customers WHERE phone=? AND id!=?',
      [new_mobile, customer.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Nambari ya simu tayari inatumika' });
    }

    // Update mobile number
    await pool.execute(
      'UPDATE customers SET phone=? WHERE id=?',
      [new_mobile, customer.id]
    );

    return res.json({ message: 'Nambari ya simu imesasishwa kikamilifu. Unaweza kuingia sasa kwa nambari yako mpya ya simu.' });
  } catch (err) {
    console.error("Change Mobile Error:", err);
    return res.status(500).json({ message: 'Hitilafu ya seva' });
  }
}

// ---------------------- VERIFY PASSWORD FOR ORDER CONFIRMATION ----------------------
async function verifyPasswordForOrder(req, res) {
  try {
    const customerId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Nenosiri linahitajika' });
    }

    // Get customer
    const [custRows] = await pool.execute(
      'SELECT password FROM customers WHERE id = ?',
      [customerId]
    );

    if (custRows.length === 0) {
      return res.status(404).json({ message: 'Mteja hajapatikana' });
    }

    const customer = custRows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Nenosiri si sahihi' });
    }

    return res.json({ message: 'Nenosiri limehakikiwa kikamilifu' });
  } catch (err) {
    console.error("Verify Password Error:", err);
    return res.status(500).json({ message: 'Hitilafu ya seva' });
  }
}

// ---------------------- UPDATE ORDER STATUS WITH PASSWORD VERIFICATION ----------------------
async function confirmOrderReception(req, res) {
  try {
    const { order_id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Nenosiri linahitajika kuthibitisha kupokea agizo" });
    }

    const customerId = req.user.id;

    // Verify customer password
    const [custRows] = await pool.execute(
      'SELECT password FROM customers WHERE id = ?',
      [customerId]
    );

    if (custRows.length === 0) {
      return res.status(404).json({ message: "Mteja hajapatikana" });
    }

    const customer = custRows[0];
    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Nenosiri si sahihi" });
    }

    // Check order status
    const [orders] = await pool.execute(
      "SELECT status FROM orders WHERE id=? AND customer_id=?",
      [order_id, customerId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "Agizo halijapatikana" });
    }

    const order = orders[0];

    if (order.status !== 'Inasafirishwa') {
      return res.status(400).json({ message: "Agizo haliko tayari kuwekewa alama kama lililopokelewa" });
    }

    // Update order status to received
    await pool.execute(
      "UPDATE orders SET status='Imepokelewa' WHERE id=?",
      [order_id]
    );

    return res.json({ message: "Kupokea agizo kumethibitishwa kikamilifu" });
  } catch (err) {
    console.error("Confirm Order Reception Error:", err);
    return res.status(500).json({ message: "Hitilafu ya seva" });
  }
}


async function getCustomerProfile(req, res) {
  try {
    const id = req.user.id;
    const [rows] = await pool.execute(
      'SELECT id, first_name, last_name, phone, email, address, gender, created_at FROM customers WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Mteja hajapatikana' });
    return res.json({ customer: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Hitilafu ya seva' });
  }
}

async function updateProfile(req, res) {
  try {
    const id = req.user.id;
    const { first_name, last_name, address, gender, new_phone, new_email, current_password } = req.body;

    const [custRows] = await pool.execute('SELECT * FROM customers WHERE id = ?', [id]);
    if (custRows.length === 0) return res.status(404).json({ message: 'Mteja hajapatikana' });

    const customer = custRows[0];

    // Verify current password for sensitive changes
    if (new_phone || new_email) {
      if (!current_password) {
        return res.status(400).json({ message: 'Nenosiri la sasa linahitajika kwa mabadiliko haya' });
      }
      
      const isPasswordValid = await bcrypt.compare(current_password, customer.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Nenosiri la sasa si sahihi' });
      }
    }

    if (new_phone && new_phone !== customer.phone) {
      // Check if new phone is already taken
      const [existing] = await pool.execute('SELECT id FROM customers WHERE phone = ? AND id != ?', [new_phone, id]);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Nambari ya simu tayari inatumika' });
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

    return res.json({ message: 'Wasifu umesasishwa', customer: updated[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Hitilafu ya seva' });
  }
}

// Remove OTP-related functions and replace with password verification
async function changeEmail(req, res) {
  try {
    const id = req.user.id;
    const { new_email, current_password } = req.body;

    if (!new_email || !current_password) {
      return res.status(400).json({ message: 'Barua pepe mpya na nenosiri la sasa vinahitajika' });
    }

    const [custRows] = await pool.execute('SELECT * FROM customers WHERE id = ?', [id]);
    if (custRows.length === 0) return res.status(404).json({ message: 'Mteja hajapatikana' });

    const customer = custRows[0];

    // Verify current password
    const isPasswordValid = await bcrypt.compare(current_password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Nenosiri la sasa si sahihi' });
    }

    // Update email
    await pool.execute('UPDATE customers SET email = ? WHERE id = ?', [new_email, id]);

    const [updated] = await pool.execute(
      'SELECT id, first_name, last_name, phone, email, address, gender FROM customers WHERE id = ?',
      [id]
    );

    return res.json({ message: 'Barua pepe imesasishwa kikamilifu', customer: updated[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Hitilafu ya seva' });
  }
}

async function changePhone(req, res) {
  try {
    const id = req.user.id;
    const { new_phone, current_password } = req.body;

    if (!new_phone || !current_password) {
      return res.status(400).json({ message: 'Nambari ya simu mpya na nenosiri la sasa vinahitajika' });
    }

    const [custRows] = await pool.execute('SELECT * FROM customers WHERE id = ?', [id]);
    if (custRows.length === 0) return res.status(404).json({ message: 'Mteja hajapatikana' });

    const customer = custRows[0];

    // Verify current password
    const isPasswordValid = await bcrypt.compare(current_password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Nenosiri la sasa si sahihi' });
    }

    // Check if new phone is already taken
    const [existing] = await pool.execute('SELECT id FROM customers WHERE phone = ? AND id != ?', [new_phone, id]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Nambari ya simu tayari inatumika' });
    }

    // Update phone
    await pool.execute('UPDATE customers SET phone = ? WHERE id = ?', [new_phone, id]);

    const [updated] = await pool.execute(
      'SELECT id, first_name, last_name, phone, email, address, gender FROM customers WHERE id = ?',
      [id]
    );

    return res.json({ message: 'Nambari ya simu imesasishwa kikamilifu', customer: updated[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Hitilafu ya seva' });
  }
}

async function changePassword(req, res) {
  try {
    const id = req.user.id;
    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({ message: 'Sehemu zote za nenosiri zinahitajika' });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ message: 'Nenosiri jipya halifanani' });
    }

    const [custRows] = await pool.execute('SELECT * FROM customers WHERE id = ?', [id]);
    if (custRows.length === 0) return res.status(404).json({ message: 'Mteja hajapatikana' });

    const customer = custRows[0];

    // Verify current password
    const isPasswordValid = await bcrypt.compare(current_password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Nenosiri la sasa si sahihi' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await pool.execute('UPDATE customers SET password = ? WHERE id = ?', [hashedPassword, id]);

    return res.json({ message: 'Nenosiri limebadilishwa kikamilifu' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Hitilafu ya seva' });
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
    return res.status(500).json({ message: 'Hitilafu ya seva' });
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
    return res.status(500).json({ message: 'Hitilafu ya seva' });
  }
}

// ---------------------- GET ALL PRODUCTS FOR CUSTOMERS ----------------------
async function getAllProducts(req, res) {
  try {
    const [products] = await pool.execute(
      `SELECT p.id, p.name, p.company, p.color, p.discount_percent, 
              p.type, p.price, p.description, p.created_at,
              SUM(ps.stock) as total_stock
       FROM products p
       LEFT JOIN product_sizes ps ON p.id = ps.product_id
       GROUP BY p.id
       ORDER BY p.created_at DESC`
    );

    for (let product of products) {
      // Get images
      const [images] = await pool.execute(
        'SELECT image_url FROM product_images WHERE product_id = ? ORDER BY id',
        [product.id]
      );
      product.images = images.map(img => img.image_url);

      // Get all sizes with their individual stock
      const [sizes] = await pool.execute(
        'SELECT id, size_code, size_label, stock FROM product_sizes WHERE product_id = ? ORDER BY size_code',
        [product.id]
      );
      product.sizes = sizes;

      // Calculate final price with discount
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
    res.status(500).json({ message: 'Hitilafu ya seva' });
  }
}

// ---------------------- GET PRODUCT BY ID FOR CUSTOMERS ----------------------
async function getProductById(req, res) {
  try {
    const { id } = req.params;
    
    // Get product basic info
    const [rows] = await pool.execute(
      `SELECT p.id, p.name, p.company, p.color, p.discount_percent, 
              p.type, p.price, p.description, p.created_at
       FROM products p
       WHERE p.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Bidhaa haijapatikana' });
    }

    const product = rows[0];

    // Get images
    const [images] = await pool.execute(
      'SELECT image_url FROM product_images WHERE product_id = ? ORDER BY id',
      [id]
    );
    product.images = images.map(img => img.image_url);

    // Get all sizes with stock
    const [sizes] = await pool.execute(
      `SELECT id, size_code, size_label, stock 
       FROM product_sizes 
       WHERE product_id = ? 
       ORDER BY size_code`,
      [id]
    );
    product.sizes = sizes;

    // Calculate total stock
    product.total_stock = sizes.reduce((sum, size) => sum + (size.stock || 0), 0);

    // Calculate final price with discount
    if (product.discount_percent && product.discount_percent > 0) {
      const discount = (product.price * product.discount_percent) / 100;
      product.final_price = product.price - discount;
    } else {
      product.final_price = product.price;
    }

    res.json(product);
  } catch (err) {
    console.error('Customer Get Product Error:', err);
    res.status(500).json({ message: 'Hitilafu ya seva' });
  }
}

// ---------------------- PLACE ORDER (Updated for sizes) ----------------------
async function placeOrder(req, res) {
  try {
    const customer_id = req.user.id;
    const { items } = req.body; // items now include size_id

    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: 'Vipengee vya agizo vinahitajika' });

    let totalAmount = 0;
    const orderItemsData = [];

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (let item of items) {
        const { product_id, size_id, quantity } = item;
        
        if (!product_id || !size_id || !quantity || quantity < 1)
          return res.status(400).json({ message: 'Bidhaa, saizi au idadi si sahihi' });

        // Get product and size info
        const [rows] = await connection.execute(
          `SELECT p.price, p.discount_percent, ps.stock, ps.size_label
           FROM products p
           JOIN product_sizes ps ON p.id = ps.product_id
           WHERE p.id = ? AND ps.id = ?`,
          [product_id, size_id]
        );
        
        if (rows.length === 0) 
          return res.status(404).json({ message: `Bidhaa au saizi ${product_id}-${size_id} haijapatikana` });

        const product = rows[0];
        
        // Check stock for specific size
        if (product.stock < quantity)
          return res.status(400).json({ 
            message: `Hakuna akiba ya kutosha ya bidhaa hii (Saizi: ${product.size_label})` 
          });

        const discountPercent = product.discount_percent || 0;
        const unitPrice = product.price * (1 - discountPercent / 100);
        const lineTotal = unitPrice * quantity;

        totalAmount += lineTotal;

        orderItemsData.push({ 
          product_id, 
          size_id, 
          quantity, 
          unit_price: unitPrice, 
          line_total: lineTotal 
        });

        // Reduce stock for specific size
        await connection.execute(
          'UPDATE product_sizes SET stock = stock - ? WHERE id = ?',
          [quantity, size_id]
        );
      }

      // Apply cart-level discount if 3 or more items
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      if (totalItems >= 3) totalAmount *= 0.9;

      // Create order
      const [orderResult] = await connection.execute(
        'INSERT INTO orders (customer_id, total_price, status) VALUES (?, ?, ?)',
        [customer_id, totalAmount, 'Imewekwa']
      );

      const order_id = orderResult.insertId;

      // Insert order items with size info
      for (let item of orderItemsData) {
        await connection.execute(
          `INSERT INTO order_items (order_id, product_id, size_id, quantity, unit_price, line_total) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [order_id, item.product_id, item.size_id, item.quantity, item.unit_price, item.line_total]
        );
      }

      await connection.commit();

      res.status(201).json({ 
        message: 'Agizo limewekwa kikamilifu', 
        order_id, 
        total_price: totalAmount, 
        status: 'Imewekwa' 
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (err) {
    console.error('Place Order Error:', err);
    res.status(500).json({ message: 'Hitilafu ya seva' });
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
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
}

// ---------------------- CANCEL ORDER ----------------------
async function cancelOrder(req, res) {
  try {
    const customerId = req.user.id;
    const { order_id } = req.params;
    const { reason } = req.body;

    if (!reason) return res.status(400).json({ message: "Sababu ya kughairi inahitajika" });

    const [orders] = await pool.execute(
      'SELECT status FROM orders WHERE id = ? AND customer_id = ?',
      [order_id, customerId]
    );
    if (orders.length === 0) return res.status(404).json({ message: "Agizo halijapatikana" });

    if (orders[0].status !== 'Imewekwa') return res.status(400).json({ message: "Agizo lenye hali ya 'Imewekwa' tu ndilo linaweza kughairiwa" });

    await pool.execute('UPDATE orders SET status="Ghairishwa" WHERE id=?', [order_id]);

    const message = `Agizo id ${order_id} imeghairishwa kwasababu ${reason}`;
    await pool.execute('INSERT INTO customer_notifications (customer_id, message) VALUES (?, ?)', [customerId, message]);

    res.json({ message: "Agizo limeghairiwa kikamilifu" });
  } catch (err) {
    console.error("Cancel Order Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
}

// ---------------------- RETURN ORDER ----------------------
async function returnOrder(req, res) {
  try {
    const customerId = req.user.id;
    const { order_id } = req.params;
    const { reason, productCondition } = req.body;

    if (!reason) return res.status(400).json({ message: "Sababu ya kurudisha inahitajika" });
    
    if (!productCondition.originalPackaging || !productCondition.tagsAttached || !productCondition.notUsed) {
        return res.status(400).json({ message: "Bidhaa lazima iwe katika mfuko wa asili, lebo zimeunganishwa, na haijatumika." });
    }

    const [orders] = await pool.execute(
      'SELECT status, created_at FROM orders WHERE id=? AND customer_id=?',
      [order_id, customerId]
    );
    if (orders.length === 0) return res.status(404).json({ message: "Agizo halijapatikana" });

    const order = orders[0];
    if (order.status !== 'Imepokelewa') return res.status(400).json({ message: "Bidhaa uliyopokea tu ndio utaweza kurudisha" });

    const diffDays = Math.floor((new Date() - new Date(order.created_at)) / (1000 * 60 * 60 * 24));
    if (diffDays > 3) return res.status(400).json({ message: "Muda wa kurudisha (siku 3) umekwisha" });

    await pool.execute('UPDATE orders SET status="Kurudishwa" WHERE id=?', [order_id]);

    const message = `Agizo id ${order_id} inaombwa kurudishwa kwasababu ${reason}`;
    await pool.execute(
      'INSERT INTO customer_notifications (customer_id, message) VALUES (?, ?)',
      [customerId, message]
    );

    res.json({ message: "Ombi la kurudisha agizo limewasilishwa kikamilifu" });
  } catch (err) {
    console.error("Return Order Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
}

// ---------------------- RATE ORDER ----------------------
async function rateOrder(req, res) {
  try {
    const customerId = req.user.id;
    const { order_id } = req.params;
    const { package_rating, delivery_rating, product_rating, overall_comment } = req.body;

    if (![package_rating, delivery_rating, product_rating].every(r => r >= 1 && r <= 5)) {
      return res.status(400).json({ message: "Ukadiriaji uwe kati ya 1 na 5" });
    }

    const [orders] = await pool.execute(
      'SELECT status FROM orders WHERE id=? AND customer_id=?',
      [order_id, customerId]
    );
    if (orders.length === 0) return res.status(404).json({ message: "Agizo halijapatikana" });
    if (orders[0].status !== 'Imepokelewa') return res.status(400).json({ message: "Agizo lililopokelewa tu ndilo linaweza kupimwa" });

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

    res.json({ message: "Agizo limepimwa kikamilifu" });
  } catch (err) {
    console.error("Rate Order Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
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
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
}

// ---------------------- CUSTOMER MESSAGES ----------------------
async function sendCustomerMessage(req, res) {
  try {
    const customer_id = req.user.id;
    const { message } = req.body;

    if (!message)
      return res.status(400).json({ message: 'Ujumbe Unahitajika!' });

    const [result] = await pool.execute(
      'INSERT INTO customer_notifications (customer_id, message) VALUES (?, ?)',
      [customer_id, message]
    );

    return res.status(201).json({ message: 'Ujumbe umetumwa', id: result.insertId });
  } catch (err) {
    console.error("Send Message Error:", err);
    return res.status(500).json({ message: 'Hitilafu ya seva' });
  }
}
// ---------------------- REFRESH TOKEN ----------------------
async function refreshToken(req, res) {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(401).json({ message: 'Hakuna tokeni ya kufanyia upya ilitolewa' });

    const decoded = verifyRefreshToken(token);
    if (!decoded) return res.status(401).json({ message: 'Tokeni ya kufanyia upya si sahihi au imeisha muda wake' });

    const newAccessToken = generateAccessToken({ id: decoded.id, phone: decoded.phone });
    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Hitilafu ya seva' });
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