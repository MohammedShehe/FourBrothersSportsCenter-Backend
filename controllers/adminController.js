const db = require('../config/database');
const jwt = require('jsonwebtoken');
const { generateOTP, sendOTPSMS, sendBulkEmail } = require('../utils/helpers');
require('dotenv').config();

// ---------------------- ADMIN LOGIN (SEND OTP) ----------------------
exports.login = async (req, res) => {
  try {
    const { first_name, last_name } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({ message: "First name and last name are required" });
    }

    // Check admin exists
    const [rows] = await db.query(
      "SELECT * FROM users WHERE first_name=? AND last_name=? AND is_admin=1 LIMIT 1",
      [first_name, last_name]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const admin = rows[0];

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + (process.env.OTP_EXPIRES_MINUTES || 5) * 60 * 1000);

    // Save OTP to DB
    await db.query(
      "INSERT INTO admin_otps (user_id, otp_code, expires_at, verified) VALUES (?, ?, ?, 0)",
      [admin.id, otp, expiresAt]
    );

    // Send OTP via SMS
    try {
      await sendOTPSMS(admin.mobile, otp);
    } catch (e) {
      console.error("⚠️ Failed to send OTP via SMS:", e.message);
    }

    // Also send OTP via email if admin has email
    if (admin.email) {
      try {
        await sendBulkEmail(
          [admin.email],
          "Your Admin OTP Code",
          `Hello ${admin.first_name},\n\nYour OTP code is: ${otp}\nIt will expire in ${process.env.OTP_EXPIRES_MINUTES || 5} minutes.\n\nRegards,\nSystem`
        );
      } catch (e) {
        console.error("⚠️ Failed to send OTP via Email:", e.message);
      }
    }

    res.json({ message: "OTP sent to registered mobile/email" });
  } catch (err) {
    console.error("Admin Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------- VERIFY OTP ----------------------
exports.verifyOtp = async (req, res) => {
  try {
    const { first_name, last_name, otp } = req.body;

    if (!first_name || !last_name || !otp) {
      return res.status(400).json({ message: "First name, last name, and OTP are required" });
    }

    // Check admin exists
    const [rows] = await db.query(
      "SELECT * FROM users WHERE first_name=? AND last_name=? AND is_admin=1 LIMIT 1",
      [first_name, last_name]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const admin = rows[0];

    // Fetch latest unverified OTP
    const [otpRows] = await db.query(
      "SELECT * FROM admin_otps WHERE user_id=? AND otp_code=? AND verified=0 ORDER BY id DESC LIMIT 1",
      [admin.id, otp]
    );

    if (otpRows.length === 0) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const otpEntry = otpRows[0];

    // Check expiration
    if (new Date(otpEntry.expires_at) < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // Mark OTP as verified
    await db.query("UPDATE admin_otps SET verified=1 WHERE id=?", [otpEntry.id]);

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    res.json({
      message: "OTP verified successfully",
      token
    });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
