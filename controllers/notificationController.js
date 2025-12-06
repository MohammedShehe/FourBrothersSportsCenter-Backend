// controllers/notificationController.js - UPDATED VERSION

const db = require('../config/database');
const { sendBulkEmail } = require('../utils/helpers');
const cloudinary = require('../config/cloudinary');
const bcrypt = require('bcrypt');

// ---------------- Ads Management ----------------
exports.postAd = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Picha inahitajika" });
    }

    const { link } = req.body;

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "four_brothers_ads" },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          return res.status(500).json({ message: "Upakiaji wa Cloudinary umeshindwa" });
        }

        await db.query(
          "INSERT INTO ads (image_url, link) VALUES (?, ?)",
          [result.secure_url, link || null]
        );

        res.status(201).json({
          message: "Tangazo limechapishwa kikamilifu",
          image_url: result.secure_url
        });
      }
    );

    uploadStream.end(req.file.buffer);

  } catch (err) {
    console.error("Post Ad Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

exports.getAds = async (req, res) => {
  try {
    const [ads] = await db.query("SELECT * FROM ads ORDER BY created_at DESC");
    res.json(ads);
  } catch (err) {
    console.error("Get Ads Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

exports.deleteAd = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query("SELECT image_url FROM ads WHERE id=?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Tangazo halijapatikana" });

    const imageUrl = rows[0].image_url;
    const filename = imageUrl.split("/").pop().split(".")[0];
    const publicId = "four_brothers_ads/" + filename;

    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.warn("Cloudinary delete failed:", err.message);
    }

    await db.query("DELETE FROM ads WHERE id=?", [id]);

    res.json({ message: "Tangazo limefutwa kikamilifu" });

  } catch (err) {
    console.error("Delete Ad Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ---------------- Customer Notifications ----------------
exports.viewCustomerNotifications = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        cn.id,
        cn.message,
        cn.created_at,
        c.id as customer_id,
        c.first_name, 
        c.last_name, 
        c.email, 
        c.gender, 
        c.phone,
        COALESCE(cnl.admin_viewed, FALSE) as admin_viewed
      FROM customer_notifications cn
      JOIN customers c ON cn.customer_id = c.id
      LEFT JOIN customer_notification_logs cnl ON cn.id = cnl.customer_notification_id
      ORDER BY cn.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("View Customer Notifications Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ---------------- Send Messages ----------------
exports.sendMessage = async (req, res) => {
  try {
    const { content, customer_ids } = req.body;
    if (!content) return res.status(400).json({ message: "Maudhui ya ujumbe yanahitajika" });

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

    if (emails.length === 0) return res.status(400).json({ message: "Hakuna wateja walio na barua pepe walipatikana" });

    await sendBulkEmail(emails, "Taarifa kutoka Four Brothers Sports Center", content);

    await db.query("INSERT INTO admin_notifications (content, type) VALUES (?, 'email')", [content]);

    res.json({ message: "Taarifa ya barua pepe imetumwa kikamilifu" });
  } catch (err) {
    console.error("Send Admin Message Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ---------------- In-App Announcements ----------------
exports.sendInAppMessageOnly = async (req, res) => {
  try {
    const { content, customer_ids } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Maudhui ya ujumbe yanahitajika" });
    }

    await db.query("DELETE FROM admin_notifications WHERE type='announcement'");

    let inserted = 0;

    if (Array.isArray(customer_ids) && customer_ids.length > 0) {
      const placeholders = customer_ids.map(() => "(?, ?, 'announcement')").join(",");
      const params = [];
      customer_ids.forEach(id => params.push(id, content));

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

    res.json({ message: "Ujumbe wa ndani wa programu umechapishwa kikamilifu", inserted });
  } catch (err) {
    console.error("Send In-App Message Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ---------------- Orders Management ----------------
exports.getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT 
        o.id AS order_id, 
        o.total_price, 
        o.status,
        o.created_at,
        c.first_name, 
        c.last_name, 
        c.phone,
        p.name AS product_name, 
        oi.quantity,
        COALESCE(onotif.admin_viewed, FALSE) as admin_viewed
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN order_notifications onotif ON o.id = onotif.order_id
      ORDER BY o.created_at DESC
    `);
    res.json(orders);
  } catch (err) {
    console.error("Get Orders Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ---------------- Update Order Status (AUTO VIEW) ----------------
exports.updateOrderStatus = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { status, customer_password } = req.body;

    // Allowed statuses without password
    const allowedStatuses = ['Imewekwa', 'Inaandaliwa', 'Inasafirishwa', 'Ghairishwa', 'Kurudishwa'];

    // NORMAL STATUS UPDATE
    if (allowedStatuses.includes(status)) {
      const [result] = await db.query(
        "UPDATE orders SET status=? WHERE id=?",
        [status, order_id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Agizo halijapatikana" });
      }

      // ★ AUTO MARK AS VIEWED ★
      await db.query(`
        INSERT INTO order_notifications (order_id, admin_viewed)
        VALUES (?, TRUE)
        ON DUPLICATE KEY UPDATE admin_viewed = TRUE
      `, [order_id]);

      return res.json({
        message: "Hali ya agizo imesasishwa kikamilifu (Admin ameona agizo)"
      });
    }

    // --- SPECIAL HANDLING FOR "Imepokelewa" ---
    if (status === 'Imepokelewa') {
      if (!customer_password) {
        return res.status(400).json({
          message: "Nenosiri la mteja linahitajika kudhibitisha kupokea agizo"
        });
      }

      const [orderRows] = await db.query(`
        SELECT o.*, c.password as customer_password_hash 
        FROM orders o 
        JOIN customers c ON o.customer_id = c.id 
        WHERE o.id = ?
      `, [order_id]);

      if (orderRows.length === 0) {
        return res.status(404).json({ message: "Agizo halijapatikana" });
      }

      const order = orderRows[0];

      if (order.status !== 'Inasafirishwa') {
        return res.status(400).json({
          message: "Agizo haliko tayari kuwekewa alama kama lililopokelewa"
        });
      }

      const isPasswordValid = await bcrypt.compare(customer_password, order.customer_password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Nenosiri la mteja si sahihi" });
      }

      await db.query("UPDATE orders SET status='Imepokelewa' WHERE id=?", [order_id]);

      // ★ AUTO MARK AS VIEWED ★
      await db.query(`
        INSERT INTO order_notifications (order_id, admin_viewed)
        VALUES (?, TRUE)
        ON DUPLICATE KEY UPDATE admin_viewed = TRUE
      `, [order_id]);

      return res.json({
        message: "Kupokea agizo kumethibitishwa kikamilifu. Hali imebadilishwa kuwa 'Imepokelewa'."
      });
    }

    return res.status(400).json({ message: "Hali ya agizo si sahihi" });

  } catch (err) {
    console.error("Update Order Status Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ---------------- Get Unread Notification Counts ----------------
exports.getUnreadCounts = async (req, res) => {
  try {
    const [customerNotifications] = await db.query(`
      SELECT COUNT(*) as count 
      FROM customer_notifications cn
      LEFT JOIN customer_notification_logs log ON cn.id = log.customer_notification_id
      WHERE log.admin_viewed IS NULL OR log.admin_viewed = FALSE
    `);

    const [orderNotifications] = await db.query(`
      SELECT COUNT(*) as count 
      FROM orders o
      LEFT JOIN order_notifications onotif ON o.id = onotif.order_id
      WHERE (onotif.admin_viewed IS NULL OR onotif.admin_viewed = FALSE)
      AND o.status NOT IN ('Ghairishwa', 'Kurudishwa')
    `);

    res.json({
      unread_customer_notifications: customerNotifications[0].count,
      unread_order_notifications: orderNotifications[0].count
    });
  } catch (err) {
    console.error("Get Unread Counts Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ---------------- Mark Customer Notification as Read ----------------
exports.markCustomerNotificationRead = async (req, res) => {
  try {
    const { notification_id } = req.params;

    const [exists] = await db.query(
      "SELECT id FROM customer_notifications WHERE id = ?",
      [notification_id]
    );

    if (exists.length === 0) {
      return res.status(404).json({ message: "Arifa haijapatikana" });
    }

    await db.query(`
      INSERT INTO customer_notification_logs (customer_notification_id, admin_viewed) 
      VALUES (?, TRUE)
      ON DUPLICATE KEY UPDATE admin_viewed = TRUE
    `, [notification_id]);

    res.json({
      message: "Arifa imewekewa alama kama iliosomwa",
      success: true
    });
  } catch (err) {
    console.error("Mark Notification Read Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ---------------- Mark Order as Viewed (optional left) ----------------
exports.markOrderViewed = async (req, res) => {
  try {
    const { order_id } = req.params;

    const [exists] = await db.query(
      "SELECT id FROM orders WHERE id = ?",
      [order_id]
    );

    if (exists.length === 0) {
      return res.status(404).json({ message: "Agizo halijapatikana" });
    }

    await db.query(`
      INSERT INTO order_notifications (order_id, admin_viewed) 
      VALUES (?, TRUE)
      ON DUPLICATE KEY UPDATE admin_viewed = TRUE
    `, [order_id]);

    res.json({
      message: "Agizo limewekewa alama kama lililosomwa",
      success: true
    });
  } catch (err) {
    console.error("Mark Order Viewed Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ---------------- Mark All Notifications as Read ----------------
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const [unreadNotifications] = await db.query(`
      SELECT cn.id 
      FROM customer_notifications cn
      LEFT JOIN customer_notification_logs log ON cn.id = log.customer_notification_id
      WHERE log.admin_viewed IS NULL OR log.admin_viewed = FALSE
    `);

    for (const notification of unreadNotifications) {
      await db.query(`
        INSERT INTO customer_notification_logs (customer_notification_id, admin_viewed) 
        VALUES (?, TRUE)
        ON DUPLICATE KEY UPDATE admin_viewed = TRUE
      `, [notification.id]);
    }

    res.json({
      message: "Arifa zote zimewekewa alama kama zilisomwa",
      success: true
    });
  } catch (err) {
    console.error("Mark All Notifications Read Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ---------------- Get Announcements ----------------
exports.getAnnouncements = async (req, res) => {
  try {
    const [announcements] = await db.query(`
      SELECT * FROM admin_notifications 
      WHERE type = 'announcement' 
      ORDER BY created_at DESC
    `);
    res.json(announcements);
  } catch (err) {
    console.error("Get Announcements Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};
