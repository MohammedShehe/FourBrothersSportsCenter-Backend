const nodemailer = require('nodemailer');
const axios = require('axios');
const db = require('../config/database');
require('dotenv').config();


// 🔹 Normalize phone numbers to E.164 format
function normalizeNumber(phone, countryCode = '+255') {
  let cleaned = phone.trim();
  cleaned = cleaned.replace(/[^0-9+]/g, '');

  if (cleaned.startsWith('+')) return cleaned;

  if (cleaned.startsWith('0')) return countryCode + cleaned.substring(1);
  if (cleaned.startsWith(countryCode.replace('+', ''))) return '+' + cleaned;

  return countryCode + cleaned;
}

// Remove sendOTPSMS function

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
  sendBulkEmail,
  normalizeNumber
};