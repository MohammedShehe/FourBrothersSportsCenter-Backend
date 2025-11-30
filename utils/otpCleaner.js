const db = require('../config/database');
const cron = require('node-cron');

// ---------------------- CLEANUP EXPIRED OTPs ----------------------
// Runs every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  try {
    // Cleanup admin OTPs
    const [adminResult] = await db.query(
      "DELETE FROM admin_otps WHERE expires_at < NOW() AND verified=0"
    );

    // Cleanup customer OTPs
    const [customerResult] = await db.query(
      "DELETE FROM customer_otps WHERE expires_at < NOW() AND used=0"
    );

    if (adminResult.affectedRows > 0 || customerResult.affectedRows > 0) {
      console.log(`🧹 Cleanup: Deleted ${adminResult.affectedRows} expired admin OTPs and ${customerResult.affectedRows} expired customer OTPs`);
    }
  } catch (err) {
    console.error("⚠️ OTP Cleanup Error:", err.message);
  }
});