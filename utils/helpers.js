const nodemailer = require('nodemailer');

// 🔹 Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 🔹 Send OTP via SMS (placeholder for Tanzania SMS gateway)
async function sendOTPSMS(mobile, otp) {
  try {
    console.log(`🔑 OTP for ${mobile}: ${otp}`);

    // TODO: integrate with actual Tanzania SMS gateway (e.g., Infobip, Africa'sTalking, Twilio, etc.)
    // Example:
    // await smsClient.send({ to: mobile, message: `Your OTP is: ${otp}` });

    return { success: true };
  } catch (err) {
    console.error("SMS sending failed:", err.message);
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
    console.error("Email sending failed:", err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  generateOTP,
  sendOTPSMS,
  sendBulkEmail
};
