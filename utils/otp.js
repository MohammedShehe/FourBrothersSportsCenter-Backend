// utils/otp.js
const crypto = require('crypto');
const dotenv = require('dotenv');
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

// ---------------------- SEND OTP VIA PHONE ----------------------
async function sendOtpToNumber(phone, otp) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (sid && token && from) {
    try {
      const Twilio = require('twilio');
      const client = Twilio(sid, token);
      const msg = `Your Four Brothers Sports Center OTP is: ${otp}. It expires in ${otpExpireMinutes} minutes.`;

      const res = await client.messages.create({
        body: msg,
        from,
        to: phone
      });

      console.log(`✅ OTP sent via Twilio -> phone: ${phone}, sid: ${res.sid}`);
      return { success: true, sid: res.sid };
    } catch (err) {
      console.error('⚠️ Twilio send error, falling back to console log:', err.message);

      // Fallback: log OTP for development
      console.log(`🔑 DEV OTP -> phone: ${phone}, otp: ${otp} (expires in ${otpExpireMinutes} minutes)`);
      return { success: true, debug: true, error: err.message };
    }
  } else {
    // Twilio not configured: log the OTP for developer testing
    console.log(`🔑 DEV OTP -> phone: ${phone}, otp: ${otp} (expires in ${otpExpireMinutes} minutes)`);
    return { success: true, debug: true };
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
