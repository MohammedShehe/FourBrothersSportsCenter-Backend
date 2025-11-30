const nodemailer = require('nodemailer');
const twilio = require('twilio');

// 🔹 Twilio client setup
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// 🔹 Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Normalize Tanzanian phone numbers to E.164 format (+255...)
function normalizeTanzaniaNumber(phone) {
  let cleaned = phone.trim();

  // Remove spaces, dashes, etc.
  cleaned = cleaned.replace(/[^0-9+]/g, '');

  // If already starts with +255, return as-is
  if (cleaned.startsWith('+255')) {
    return cleaned;
  }

  // If starts with 0 (local format like 0777...), replace with +255
  if (cleaned.startsWith('0')) {
    return '+255' + cleaned.substring(1);
  }

  // If starts with 255 without +, add +
  if (cleaned.startsWith('255')) {
    return '+' + cleaned;
  }

  // Fallback: assume it's missing and prepend +255
  return '+255' + cleaned;
}

// 🔹 Send OTP via SMS using Twilio
async function sendOTPSMS(mobile, otp) {
  try {
    // Ensure mobile is in E.164 format (e.g., +255XXXXXXXXX)
    if (!mobile.startsWith('+')) {
      throw new Error('Mobile number must be in E.164 format starting with +countrycode');
    }

    const message = await twilioClient.messages.create({
      body: `Your OTP is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER, // Twilio number from your account
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