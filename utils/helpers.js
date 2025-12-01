const nodemailer = require('nodemailer');
const twilio = require('twilio');
const db = require('../config/database');

// 🔹 Twilio client setup
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// 🔹 Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 🔹 Normalize Tanzanian phone numbers to E.164 format (+255...)
function normalizeTanzaniaNumber(phone) {
  let cleaned = phone.trim();
  cleaned = cleaned.replace(/[^0-9+]/g, '');

  if (cleaned.startsWith('+255')) return cleaned;
  if (cleaned.startsWith('0')) return '+255' + cleaned.substring(1);
  if (cleaned.startsWith('255')) return '+' + cleaned;

  return '+255' + cleaned;
}

/**
 * 🔹 Send OTP via SMS using user ID.
 * Fetches the phone number automatically from the database.
 *
 * @param {number} userId - User ID from the database
 * @param {string} otp - Generated OTP
 */
async function sendOTPSMS(userId, otp) {
  try {
    // Fetch mobile from DB
    const [rows] = await db.query(
      "SELECT mobile FROM users WHERE id=? LIMIT 1",
      [userId]
    );

    if (rows.length === 0 || !rows[0].mobile) {
      console.warn("⚠️ No mobile number stored. Skipping SMS.");
      return { success: false, error: "No mobile number stored" };
    }

    // Normalize number to +255 format
    const mobile = normalizeTanzaniaNumber(rows[0].mobile);

    if (!mobile.startsWith('+')) {
      throw new Error("Mobile number must be in E.164 format starting with +countrycode");
    }

    // Send SMS via Twilio
    const message = await twilioClient.messages.create({
      body: `Your OTP is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: mobile
    });

    console.log(`📲 OTP sent to ${mobile}: ${otp} (SID: ${message.sid})`);
    return { success: true };

  } catch (err) {
    console.error("⚠️ SMS sending failed:", err.message);
    return { success: false, error: err.message };
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
  normalizeTanzaniaNumber
};
