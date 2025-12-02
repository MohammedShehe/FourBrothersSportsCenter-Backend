// utils/helpers.js
const nodemailer = require('nodemailer');
const axios = require('axios');
const db = require('../config/database');
require('dotenv').config();

// 🔹 Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 🔹 Normalize phone numbers to E.164 format
function normalizeNumber(phone, countryCode = '+255') {
  let cleaned = phone.trim();
  cleaned = cleaned.replace(/[^0-9+]/g, '');

  if (cleaned.startsWith('+')) return cleaned;

  if (cleaned.startsWith('0')) return countryCode + cleaned.substring(1);
  if (cleaned.startsWith(countryCode.replace('+', ''))) return '+' + cleaned;

  return countryCode + cleaned;
}

/**
 * 🔹 Send OTP via Termii SMS using user ID
 * Fetches the phone number automatically from the database.
 *
 * @param {number|string} userIdOrPhone - User ID or phone number
 * @param {string} otp - Generated OTP
 */
async function sendOTPSMS(userIdOrPhone, otp) {
  try {
    let mobile = userIdOrPhone;

    // If a number is not directly passed, fetch from DB using user ID
    if (typeof userIdOrPhone === 'number') {
      const [rows] = await db.query(
        "SELECT mobile FROM users WHERE id=? LIMIT 1",
        [userIdOrPhone]
      );

      if (!rows.length || !rows[0].mobile) {
        console.warn("⚠️ No mobile number stored. Skipping SMS.");
        return { success: false, error: "No mobile number stored" };
      }

      mobile = rows[0].mobile;
    }

    mobile = normalizeNumber(mobile);

    const payload = {
      api_key: process.env.TERMII_API_KEY,
      to: mobile,
      from: process.env.TERMII_SENDER_ID || "Termii",
      sms: `Your OTP is: ${otp}`,
      type: "plain",
      channel: "generic"
    };

    const response = await axios.post(
      `${process.env.TERMII_BASE_URL}/api/sms/send`,
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    console.log(`📲 OTP sent to ${mobile}: ${otp}`);
    return { success: true, data: response.data };

  } catch (err) {
    console.error("⚠️ SMS sending failed:", err.response?.data || err.message);
    return { success: false, error: err.response?.data || err.message };
  }
}

// 🔹 Send bulk emails
async function sendBulkEmail(emails, subject, content) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: Array.isArray(emails) ? emails.join(",") : emails,
      subject: subject,
      text: content
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to: ${emails}`);
    return { success: true };

  } catch (err) {
    console.error("⚠️ Email sending failed:", err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  generateOTP,
  sendOTPSMS,
  sendBulkEmail,
  normalizeNumber
};
