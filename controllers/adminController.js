const db = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

// ---------------------- ADMIN LOGIN ----------------------
exports.adminLogin = async (req, res) => {  // Renamed from login
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({ message: "Mobile number and password are required" });
    }

    // Check if admin exists
    const [rows] = await db.query(
      "SELECT * FROM users WHERE mobile=? AND is_admin=1 LIMIT 1",
      [mobile]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const admin = rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin.id, 
        role: 'admin',
        can_manage_admins: admin.can_manage_admins === 1
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    res.json({
      message: "Login successful",
      token,
      admin: {
        id: admin.id,
        first_name: admin.first_name,
        last_name: admin.last_name,
        mobile: admin.mobile,
        can_manage_admins: admin.can_manage_admins === 1
      }
    });

  } catch (err) {
    console.error("Admin Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------- ADMIN FORGOT PASSWORD ----------------------
exports.forgotPassword = async (req, res) => {
  try {
    const { first_name, last_name } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({ message: "First name and last name are required" });
    }

    // Check if admin exists
    const [rows] = await db.query(
      "SELECT * FROM users WHERE first_name=? AND last_name=? AND is_admin=1 LIMIT 1",
      [first_name, last_name]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Admin not found with these details" });
    }

    const admin = rows[0];

    // Generate reset token
    const resetToken = jwt.sign(
      { id: admin.id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // In a real app, send this token via email/SMS
    // For now, return it (in production, send via email)
    res.json({
      message: "Password reset authorized",
      reset_token: resetToken,
      next_step: "Use this token to reset your password"
    });

  } catch (err) {
    console.error("Admin Forgot Password Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------- RESET ADMIN PASSWORD ----------------------
exports.resetPassword = async (req, res) => {
  try {
    const { reset_token, new_password, confirm_password } = req.body;

    if (!reset_token || !new_password || !confirm_password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(reset_token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    if (decoded.type !== 'password_reset') {
      return res.status(400).json({ message: "Invalid token type" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await db.query(
      "UPDATE users SET password=? WHERE id=?",
      [hashedPassword, decoded.id]
    );

    res.json({ message: "Password reset successful. You can now login with your new password." });

  } catch (err) {
    console.error("Reset Admin Password Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------- CHANGE ADMIN MOBILE ----------------------
exports.changeMobile = async (req, res) => {
  try {
    const { first_name, last_name, new_mobile, confirm_mobile } = req.body;

    if (!first_name || !last_name || !new_mobile || !confirm_mobile) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (new_mobile !== confirm_mobile) {
      return res.status(400).json({ message: "Mobile numbers do not match" });
    }

    // Check if admin exists
    const [rows] = await db.query(
      "SELECT * FROM users WHERE first_name=? AND last_name=? AND is_admin=1 LIMIT 1",
      [first_name, last_name]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Admin not found with these details" });
    }

    const admin = rows[0];

    // Check if new mobile is already taken
    const [existing] = await db.query(
      "SELECT id FROM users WHERE mobile=? AND id!=?",
      [new_mobile, admin.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Mobile number already in use" });
    }

    // Update mobile number
    await db.query(
      "UPDATE users SET mobile=? WHERE id=?",
      [new_mobile, admin.id]
    );

    res.json({ message: "Mobile number updated successfully. You can now login with your new mobile number." });

  } catch (err) {
    console.error("Change Admin Mobile Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------- ADD NEW ADMIN (Only by main admin) ----------------------
exports.addAdmin = async (req, res) => {
  try {
    // Check if requester is main admin
    if (!req.admin.can_manage_admins) {
      return res.status(403).json({ message: "Only main admin can add other admins" });
    }

    const { first_name, last_name, mobile, password, confirm_password } = req.body;

    if (!first_name || !last_name || !mobile || !password || !confirm_password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if mobile already exists
    const [existing] = await db.query("SELECT id FROM users WHERE mobile=?", [mobile]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Mobile number already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new admin (can_manage_admins = 0 for non-main admins)
    await db.query(
      "INSERT INTO users (first_name, last_name, mobile, password, is_admin, can_manage_admins) VALUES (?, ?, ?, ?, 1, 0)",
      [first_name, last_name, mobile, hashedPassword]
    );

    res.status(201).json({ message: "Admin added successfully" });

  } catch (err) {
    console.error("Add Admin Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------- UPDATE ADMIN CREDENTIALS (Only by main admin) ----------------------
exports.updateAdmin = async (req, res) => {
  try {
    // Check if requester is main admin
    if (!req.admin.can_manage_admins) {
      return res.status(403).json({ message: "Only main admin can update admin credentials" });
    }

    const { id } = req.params;
    const { first_name, last_name, mobile, password } = req.body;

    // Check if admin exists
    const [adminRows] = await db.query("SELECT * FROM users WHERE id=? AND is_admin=1", [id]);
    if (adminRows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const updateFields = [];
    const updateValues = [];

    if (first_name) {
      updateFields.push("first_name=?");
      updateValues.push(first_name);
    }

    if (last_name) {
      updateFields.push("last_name=?");
      updateValues.push(last_name);
    }

    if (mobile) {
      // Check if mobile is already taken by another admin
      const [existing] = await db.query(
        "SELECT id FROM users WHERE mobile=? AND id!=?",
        [mobile, id]
      );
      if (existing.length > 0) {
        return res.status(400).json({ message: "Mobile number already in use" });
      }
      updateFields.push("mobile=?");
      updateValues.push(mobile);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push("password=?");
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    updateValues.push(id);
    const query = `UPDATE users SET ${updateFields.join(", ")} WHERE id=?`;

    await db.query(query, updateValues);

    res.json({ message: "Admin updated successfully" });

  } catch (err) {
    console.error("Update Admin Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------- GET ALL ADMINS (Only by main admin) ----------------------
exports.getAdmins = async (req, res) => {
  try {
    // Check if requester is main admin
    if (!req.admin.can_manage_admins) {
      return res.status(403).json({ message: "Only main admin can view all admins" });
    }

    const [admins] = await db.query(
      "SELECT id, first_name, last_name, mobile, can_manage_admins, created_at FROM users WHERE is_admin=1 ORDER BY created_at DESC"
    );

    // Remove password from response
    const safeAdmins = admins.map(admin => ({
      ...admin,
      can_manage_admins: admin.can_manage_admins === 1
    }));

    res.json(safeAdmins);

  } catch (err) {
    console.error("Get Admins Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------- DELETE ADMIN (Only by main admin) ----------------------
exports.deleteAdmin = async (req, res) => {
  try {
    // Check if requester is main admin
    if (!req.admin.can_manage_admins) {
      return res.status(403).json({ message: "Only main admin can delete admins" });
    }

    const { id } = req.params;

    // Prevent deleting main admin (id=1)
    if (parseInt(id) === 1) {
      return res.status(400).json({ message: "Cannot delete main admin" });
    }

    // Check if admin exists
    const [adminRows] = await db.query("SELECT id FROM users WHERE id=? AND is_admin=1", [id]);
    if (adminRows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    await db.query("DELETE FROM users WHERE id=?", [id]);

    res.json({ message: "Admin deleted successfully" });

  } catch (err) {
    console.error("Delete Admin Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};