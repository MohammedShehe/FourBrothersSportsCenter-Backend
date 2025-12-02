// utils/otp.js
const crypto = require('crypto');
const dotenv = require('dotenv');
const axios = require('axios');
dotenv.config();

const otpLength = parseInt(process.env.OTP_LENGTH || '6', 10);
const otpExpireMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES || '5', 10);

// ---------------------- GENERATE OTP ----------------------
function generateOTP() {
  // numeric OTP with leading zeros allowed
  const max = 10 ** otpLength;
  const num = crypto.randomInt(0, max);
  return String(num).padStart(otpLength, '0');
}

// ---------------------- NORMALIZE PHONE NUMBER ----------------------
function normalizeNumber(phone, defaultCountryCode = '+255') {
  let cleaned = phone.trim().replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('0')) return defaultCountryCode + cleaned.substring(1);
  if (cleaned.startsWith(defaultCountryCode.replace('+', ''))) return '+' + cleaned;
  return defaultCountryCode + cleaned;
}

// ---------------------- SEND OTP VIA PHONE (Termii) ----------------------
async function sendOtpToNumber(phone, otp) {
  const normalizedPhone = normalizeNumber(phone);
  const payload = {
    api_key: process.env.TERMII_API_KEY,
    to: normalizedPhone,
    from: process.env.TERMII_SENDER_ID || 'Termii',
    sms: `Your Four Brothers Sports Center OTP is: ${otp}. It expires in ${otpExpireMinutes} minutes.`,
    type: 'plain',
    channel: 'generic'
  };

  try {
    const response = await axios.post(
      `${process.env.TERMII_BASE_URL}/api/sms/send`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    console.log(`✅ OTP sent via Termii -> phone: ${normalizedPhone}, response:`, response.data);
    return { success: true, data: response.data };
  } catch (err) {
    console.error('⚠️ Termii send error, fallback to console log:', err.response?.data || err.message);
    console.log(`🔑 DEV OTP -> phone: ${normalizedPhone}, otp: ${otp} (expires in ${otpExpireMinutes} minutes)`);
    return { success: false, debug: true, error: err.response?.data || err.message };
  }
}

// ---------------------- SEND OTP VIA EMAIL ----------------------
async function sendOtpToEmail(email, otp) {
  // NOTE: replace with real email service like nodemailer in production
  console.log(`🔑 DEV OTP -> email: ${email}, otp: ${otp} (expires in ${otpExpireMinutes} minutes)`);
  return { success: true, debug: true };
}

module.exports = {
  generateOTP,
  sendOtpToNumber,
  sendOtpToEmail,
  otpExpireMinutes
};
