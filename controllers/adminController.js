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

    // Check if admin exists
    const [rows] = await db.query(
      "SELECT * FROM users WHERE first_name=? AND last_name=? AND is_admin=1 LIMIT 1",
      [first_name, last_name]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const admin = rows[0];

    // ---------------------- RATE LIMIT CHECK ----------------------
    const rateLimitMinutes = 10;
    const maxRequests = 3;
    const since = new Date(Date.now() - rateLimitMinutes * 60 * 1000);

    const [recentOtps] = await db.query(
      "SELECT COUNT(*) AS count FROM admin_otps WHERE user_id=? AND created_at >= ?",
      [admin.id, since]
    );

    if (recentOtps[0].count >= maxRequests) {
      return res.status(429).json({
        message: `Too many OTP requests. Please wait ${rateLimitMinutes} minutes before trying again.`
      });
    }

    // Invalidate previous unverified OTPs
    await db.query(
      "UPDATE admin_otps SET verified=1 WHERE user_id=? AND verified=0",
      [admin.id]
    );

    // ---------------------- GENERATE OTP ----------------------
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + (process.env.OTP_EXPIRES_MINUTES || 5) * 60 * 1000);

    // Save OTP to database
    await db.query(
      "INSERT INTO admin_otps (user_id, otp_code, expires_at, verified, created_at) VALUES (?, ?, ?, 0, NOW())",
      [admin.id, otp, expiresAt]
    );

    // ---------------------- SEND OTP via SMS ----------------------
    try {
      if (!admin.mobile) {
        console.warn("⚠️ Admin has no mobile number stored.");
      } else {
        await sendOTPSMS(admin.mobile, otp);
      }
    } catch (e) {
      console.error("⚠️ Failed to send OTP via SMS:", e.message);
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
      return res.status(400).json({ message: "First name, last name and OTP are required" });
    }

    // Check if admin exists
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

    // Check if OTP has expired
    if (new Date(otpEntry.expires_at) < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // Mark OTP as verified
    await db.query(
      "UPDATE admin_otps SET verified=1 WHERE id=?",
      [otpEntry.id]
    );

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
