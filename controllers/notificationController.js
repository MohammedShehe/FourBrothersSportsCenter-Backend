// controllers/notificationController.js

const db = require('../config/database');
const { sendBulkEmail } = require('../utils/helpers');
const cloudinary = require('../config/cloudinary');


// ---------------- Ads Management ----------------
exports.postAd = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Picha inahitajika" });
    }

    const { link } = req.body;

    // Upload to Cloudinary using buffer
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
    res.json(
      ads.map(ad => ({
        ...ad,
        image_url: ad.image_url // already full URL
      }))
    );
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

    // Extract Cloudinary public_id
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
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

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
      SELECT o.id AS order_id, o.total_price, o.status,
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
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { status } = req.body;

    // Allowed statuses without OTP confirmation
    const allowedStatuses = ['Imewekwa', 'Inasafirishwa', 'Ghairishwa', 'Kurudishwa'];
    
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Hali si sahihi" });
    }

    const [result] = await db.query("UPDATE orders SET status=? WHERE id=?", [status, order_id]);

    if (result.affectedRows === 0) return res.status(404).json({ message: "Agizo halijapatikana" });

    res.json({ message: "Hali ya agizo imesasishwa kikamilifu" });
  } catch (err) {
    console.error("Update Order Status Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};