const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { normalizeNumber } = require('../utils/helpers');
require('dotenv').config();

// ---------------------- REGISTER CUSTOMER ----------------------
exports.addCustomer = async (req, res) => {
  try {
    const { first_name, last_name, phone, email, gender, password, confirm_password } = req.body;

    if (!first_name || !last_name || !phone || !gender || !password || !confirm_password) {
      return res.status(400).json({ message: "Tafadhali jaza taarifa zote muhimu" });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ message: "Nenosiri halifanani" });
    }

    // Check gender validity
    const validGenders = ["mwanaume", "mwanamke", "nyengine"];
    if (!validGenders.includes(gender.toLowerCase())) {
      return res.status(400).json({ message: "Jinsia uliyoingiza si sahihi" });
    }

    const [existing] = await db.query("SELECT id FROM customers WHERE phone = ?", [phone]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Mteja mwenye nambari hii tayari yupo" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO customers (first_name, last_name, phone, email, gender, password) VALUES (?, ?, ?, ?, ?, ?)",
      [first_name, last_name, phone, email || null, gender, hashedPassword]
    );

    res.status(201).json({ message: "Mteja ameongezwa kwa mafanikio" });
  } catch (err) {
    console.error("Add Customer Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ---------------------- CUSTOMER FORGOT PASSWORD ----------------------
exports.forgotPassword = async (req, res) => {
  try {
    const { first_name, last_name } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({ message: "Jina la kwanza na la mwisho yanahitajika" });
    }

    const [rows] = await db.query(
      "SELECT * FROM customers WHERE first_name=? AND last_name=? LIMIT 1",
      [first_name, last_name]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Hakuna mteja aliyetambuliwa kwa taarifa hizi" });
    }

    const customer = rows[0];

    const resetToken = jwt.sign(
      { id: customer.id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await db.query(
      "UPDATE customers SET reset_token=?, reset_token_expires=DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id=?",
      [resetToken, customer.id]
    );

    res.json({
      message: "Uthibitisho wa kubadili nenosiri umetolewa",
      reset_token: resetToken,
      next_step: "Tumia token hii kuweka upya nenosiri lako"
    });

  } catch (err) {
    console.error("Customer Forgot Password Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ---------------------- RESET CUSTOMER PASSWORD ----------------------
exports.resetPassword = async (req, res) => {
  try {
    const { reset_token, new_password, confirm_password } = req.body;

    if (!reset_token || !new_password || !confirm_password) {
      return res.status(400).json({ message: "Tafadhali jaza taarifa zote muhimu" });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ message: "Nenosiri halifanani" });
    }

    const [customerRows] = await db.query(
      "SELECT * FROM customers WHERE reset_token=? AND reset_token_expires > NOW() LIMIT 1",
      [reset_token]
    );

    if (customerRows.length === 0) {
      return res.status(400).json({ message: "Token ya kubadili nenosiri si sahihi au imekwisha muda" });
    }

    const customer = customerRows[0];

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await db.query(
      "UPDATE customers SET password=?, reset_token=NULL, reset_token_expires=NULL WHERE id=?",
      [hashedPassword, customer.id]
    );

    res.json({ message: "Nenosiri limebadilishwa kwa mafanikio. Sasa unaweza kuingia tena." });

  } catch (err) {
    console.error("Reset Customer Password Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ---------------------- CHANGE CUSTOMER MOBILE ----------------------
exports.changeMobile = async (req, res) => {
  try {
    const { first_name, last_name, new_mobile, confirm_mobile } = req.body;

    if (!first_name || !last_name || !new_mobile || !confirm_mobile) {
      return res.status(400).json({ message: "Tafadhali jaza taarifa zote muhimu" });
    }

    if (new_mobile !== confirm_mobile) {
      return res.status(400).json({ message: "Nambari za simu hazifanani" });
    }

    const [rows] = await db.query(
      "SELECT * FROM customers WHERE first_name=? AND last_name=? LIMIT 1",
      [first_name, last_name]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Hakuna mteja aliyetambuliwa kwa taarifa hizi" });
    }

    const customer = rows[0];

    const [existing] = await db.query(
      "SELECT id FROM customers WHERE phone=? AND id!=?",
      [new_mobile, customer.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Nambari hii ya simu tayari imesajiliwa" });
    }

    await db.query(
      "UPDATE customers SET phone=? WHERE id=?",
      [new_mobile, customer.id]
    );

    res.json({ message: "Nambari ya simu imebadilishwa kwa mafanikio. Sasa unaweza kuingia kwa kutumia nambari mpya." });

  } catch (err) {
    console.error("Change Customer Mobile Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ---------------------- GET CUSTOMERS ----------------------
exports.getCustomers = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, first_name, last_name, phone, email, gender, created_at FROM customers ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error("Get Customers Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone, email, gender } = req.body;

    const [customer] = await db.query("SELECT * FROM customers WHERE id = ?", [id]);
    if (customer.length === 0) {
      return res.status(404).json({ message: "Mteja hakupatikana" });
    }

    await db.query(
      "UPDATE customers SET first_name=?, last_name=?, phone=?, email=?, gender=? WHERE id=?",
      [first_name, last_name, phone, email || null, gender, id]
    );

    res.json({ message: "Taarifa za mteja zimesasishwa kwa mafanikio" });
  } catch (err) {
    console.error("Update Customer Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const [customer] = await db.query("SELECT * FROM customers WHERE id = ?", [id]);
    if (customer.length === 0) {
      return res.status(404).json({ message: "Mteja hakupatikana" });
    }

    await db.query("DELETE FROM customers WHERE id = ?", [id]);
    res.json({ message: "Mteja ameondolewa kwa mafanikio" });

  } catch (err) {
    console.error("Delete Customer Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ---------------------- REFRESH TOKEN ----------------------
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(401).json({ message: 'Hakuna refresh token iliyowasilishwa' });

    const { verifyRefreshToken, generateAccessToken } = require('../middleware/customerAuth');
    const decoded = verifyRefreshToken(token);

    if (!decoded) return res.status(401).json({ message: 'Refresh token si sahihi au imekwisha muda' });

    const newAccessToken = generateAccessToken({ id: decoded.id, phone: decoded.phone });
    return res.json({ accessToken: newAccessToken });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Hitilafu ya seva' });
  }
};
