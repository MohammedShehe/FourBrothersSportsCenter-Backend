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
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check gender validity
    const validGenders = ["mwanaume", "mwanamke", "nyengine"];
    if (!validGenders.includes(gender.toLowerCase())) {
      return res.status(400).json({ message: "Invalid gender provided" });
    }

    const [existing] = await db.query("SELECT id FROM customers WHERE phone = ?", [phone]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Customer with this phone already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO customers (first_name, last_name, phone, email, gender, password) VALUES (?, ?, ?, ?, ?, ?)",
      [first_name, last_name, phone, email || null, gender, hashedPassword]
    );

    res.status(201).json({ message: "Customer added successfully" });
  } catch (err) {
    console.error("Add Customer Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------- CUSTOMER FORGOT PASSWORD ----------------------
exports.forgotPassword = async (req, res) => {
  try {
    const { first_name, last_name } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({ message: "First name and last name are required" });
    }

    // Check if customer exists
    const [rows] = await db.query(
      "SELECT * FROM customers WHERE first_name=? AND last_name=? LIMIT 1",
      [first_name, last_name]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Customer not found with these details" });
    }

    const customer = rows[0];

    // Generate reset token
    const resetToken = jwt.sign(
      { id: customer.id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Save reset token to database
    await db.query(
      "UPDATE customers SET reset_token=?, reset_token_expires=DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id=?",
      [resetToken, customer.id]
    );

    res.json({
      message: "Password reset authorized",
      reset_token: resetToken,
      next_step: "Use this token to reset your password"
    });

  } catch (err) {
    console.error("Customer Forgot Password Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------- RESET CUSTOMER PASSWORD ----------------------
exports.resetPassword = async (req, res) => {
  try {
    const { reset_token, new_password, confirm_password } = req.body;

    if (!reset_token || !new_password || !confirm_password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Verify reset token and check expiration
    const [customerRows] = await db.query(
      "SELECT * FROM customers WHERE reset_token=? AND reset_token_expires > NOW() LIMIT 1",
      [reset_token]
    );

    if (customerRows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const customer = customerRows[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password and clear reset token
    await db.query(
      "UPDATE customers SET password=?, reset_token=NULL, reset_token_expires=NULL WHERE id=?",
      [hashedPassword, customer.id]
    );

    res.json({ message: "Password reset successful. You can now login with your new password." });

  } catch (err) {
    console.error("Reset Customer Password Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------- CHANGE CUSTOMER MOBILE ----------------------
exports.changeMobile = async (req, res) => {
  try {
    const { first_name, last_name, new_mobile, confirm_mobile } = req.body;

    if (!first_name || !last_name || !new_mobile || !confirm_mobile) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (new_mobile !== confirm_mobile) {
      return res.status(400).json({ message: "Mobile numbers do not match" });
    }

    // Check if customer exists
    const [rows] = await db.query(
      "SELECT * FROM customers WHERE first_name=? AND last_name=? LIMIT 1",
      [first_name, last_name]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Customer not found with these details" });
    }

    const customer = rows[0];

    // Check if new mobile is already taken
    const [existing] = await db.query(
      "SELECT id FROM customers WHERE phone=? AND id!=?",
      [new_mobile, customer.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Mobile number already in use" });
    }

    // Update mobile number
    await db.query(
      "UPDATE customers SET phone=? WHERE id=?",
      [new_mobile, customer.id]
    );

    res.json({ message: "Mobile number updated successfully. You can now login with your new mobile number." });

  } catch (err) {
    console.error("Change Customer Mobile Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Other customer controller functions remain the same...
exports.getCustomers = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, first_name, last_name, phone, email, gender, created_at FROM customers ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error("Get Customers Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone, email, gender } = req.body;

    const [customer] = await db.query("SELECT * FROM customers WHERE id = ?", [id]);
    if (customer.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    await db.query(
      "UPDATE customers SET first_name=?, last_name=?, phone=?, email=?, gender=? WHERE id=?",
      [first_name, last_name, phone, email || null, gender, id]
    );

    res.json({ message: "Customer updated successfully" });
  } catch (err) {
    console.error("Update Customer Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const [customer] = await db.query("SELECT * FROM customers WHERE id = ?", [id]);
    if (customer.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    await db.query("DELETE FROM customers WHERE id = ?", [id]);
    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error("Delete Customer Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------- REFRESH TOKEN FUNCTION ----------------------
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(401).json({ message: 'No refresh token provided' });

    const { verifyRefreshToken, generateAccessToken } = require('../middleware/customerAuth');
    const decoded = verifyRefreshToken(token);
    if (!decoded) return res.status(401).json({ message: 'Invalid or expired refresh token' });

    const newAccessToken = generateAccessToken({ id: decoded.id, phone: decoded.phone });
    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};