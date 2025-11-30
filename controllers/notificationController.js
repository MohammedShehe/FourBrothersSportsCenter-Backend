const db = require('../config/database');
const { sendBulkEmail, sendOTPSMS } = require('../utils/helpers');

// ---------------- Ads Management ----------------
exports.postAd = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Image is required" });

    const { link } = req.body;
    const imageUrl = `/uploads/products/${req.file.filename}`;

    await db.query("INSERT INTO ads (image_url, link) VALUES (?, ?)", [imageUrl, link || null]);
    res.status(201).json({ message: "Ad posted successfully" });
  } catch (err) {
    console.error("Post Ad Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAds = async (req, res) => {
  try {
    const [ads] = await db.query("SELECT * FROM ads ORDER BY created_at DESC");
    res.json(ads);
  } catch (err) {
    console.error("Get Ads Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteAd = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM ads WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Ad not found" });
    }

    res.json({ message: "Ad deleted successfully" });
  } catch (err) {
    console.error("Delete Ad Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- Notifications ----------------
exports.viewCustomerNotifications = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT cn.id, cn.message, cn.created_at,
             c.first_name, c.last_name, c.email, c.gender, c.phone
      FROM customer_notifications cn
      JOIN customers c ON cn.customer_id = c.id
      ORDER BY cn.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("View Customer Notifications Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Email notification (with log type=email)
exports.sendMessage = async (req, res) => {
  try {
    const { content, customer_ids } = req.body;
    if (!content) return res.status(400).json({ message: "Message content is required" });

    let emails = [];

    if (customer_ids?.length > 0) {
      const placeholders = customer_ids.map(() => '?').join(',');
      const [rows] = await db.query(
        `SELECT email FROM customers WHERE id IN (${placeholders}) AND email IS NOT NULL`,
        customer_ids
      );
      emails = rows.map(r => r.email);
    } else {
      const [rows] = await db.query("SELECT email FROM customers WHERE email IS NOT NULL");
      emails = rows.map(r => r.email);
    }

    if (emails.length === 0) return res.status(400).json({ message: "No customers with email found" });

    await sendBulkEmail(emails, "Notification from Four Brothers Sports Center", content);

    // Log admin notification
    await db.query("INSERT INTO admin_notifications (content, type) VALUES (?, 'email')", [content]);

    res.json({ message: "Email notification sent successfully" });
  } catch (err) {
    console.error("Send Admin Message Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 In-app announcement (with log type=announcement)
exports.sendInAppMessageOnly = async (req, res) => {
  try {
    const { content, customer_ids } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    // Delete old announcements
    await db.query("DELETE FROM admin_notifications WHERE type='announcement'");

    let inserted = 0;

    if (Array.isArray(customer_ids) && customer_ids.length > 0) {
      const placeholders = customer_ids.map(() => "(?, ?, 'announcement')").join(",");
      const params = [];
      customer_ids.forEach(id => {
        params.push(id, content);
      });

      const [result] = await db.query(
        `INSERT INTO admin_notifications (id, content, type) VALUES ${placeholders}`,
        params
      );
      inserted = result.affectedRows;
    } else {
      const [result] = await db.query(
        `INSERT INTO admin_notifications (id, content, type)
         SELECT id, ?, 'announcement' FROM customers`,
        [content]
      );
      inserted = result.affectedRows;
    }

    res.json({ message: "In-app message posted successfully", inserted });
  } catch (err) {
    console.error("Send In-App Message Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- Orders Management ----------------

// Get all orders (join with order_items)
exports.getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT o.id AS order_id, o.total_price, o.status, o.otp,
             c.first_name, c.last_name, c.phone,
             p.name AS product_name, oi.quantity
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      ORDER BY o.created_at DESC
    `);
    res.json(orders);
  } catch (err) {
    console.error("Get Orders Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { status } = req.body;

    if (!['Imewekwa', 'Inasafirishwa', 'Ghairishwa', 'Kurudishwa'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const [result] = await db.query("UPDATE orders SET status=? WHERE id=?", [status, order_id]);

    if (result.affectedRows === 0) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Order status updated successfully" });
  } catch (err) {
    console.error("Update Order Status Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Generate OTP for order reception
exports.generateOrderOtp = async (req, res) => {
  try {
    const { order_id } = req.params;

    const [orders] = await db.query(`
      SELECT o.id, o.customer_id, o.status, c.phone
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id=?`, [order_id]
    );

    if (orders.length === 0) return res.status(404).json({ message: "Order not found" });

    const order = orders[0];

    if (order.status !== 'Inasafirishwa') {
      return res.status(400).json({ message: "Order is not ready to be marked as received" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await db.query("UPDATE orders SET otp=?, status='Imepokelewa_PENDING' WHERE id=?", [otp, order_id]);

    const { normalizeTanzaniaNumber } = require('../utils/helpers');
    const normalizedPhone = normalizeTanzaniaNumber(order.phone);
    try { await sendOTPSMS(normalizedPhone, `Your OTP to confirm order ${order_id} is: ${otp}`); } 
    catch (smsErr) { console.error(`Failed to send OTP SMS for order ${order_id}:`, smsErr.message); }

    res.json({ message: "OTP generated", otp }); // optional
  } catch (err) {
    console.error("Generate OTP Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Confirm order reception via OTP
exports.confirmOrderReception = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { otp } = req.body;

    const [orders] = await db.query("SELECT otp, status FROM orders WHERE id=?", [order_id]);
    if (!orders.length) return res.status(404).json({ message: "Order not found" });

    const order = orders[0];

    if (order.status !== 'Imepokelewa_PENDING') {
      return res.status(400).json({ message: "Order is not ready for OTP confirmation" });
    }

    if (order.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    await db.query("UPDATE orders SET otp=NULL, status='Imepokelewa' WHERE id=?", [order_id]);

    res.json({ message: "Order reception confirmed successfully" });
  } catch (err) {
    console.error("Confirm Order OTP Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get OTP (optional)
exports.getOrderOtp = async (req, res) => {
  try {
    const { order_id } = req.params;
    const [rows] = await db.query("SELECT otp FROM orders WHERE id=?", [order_id]);
    if (!rows.length) return res.status(404).json({ message: "Order not found" });

    res.json({ otp: rows[0].otp });
  } catch (err) {
    console.error("Get OTP Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
