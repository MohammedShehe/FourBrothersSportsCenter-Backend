const db = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

// ---------------------- ADMIN LOGIN ----------------------
exports.adminLogin = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({ message: "Namba ya simu na nywila zinahitajika" });
    }

    const [rows] = await db.query(
      "SELECT * FROM users WHERE mobile=? AND is_admin=1 LIMIT 1",
      [mobile]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Taarifa za msimamizi hazijapatikana" });
    }

    const admin = rows[0];

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Nywila si sahihi" });
    }

    const token = jwt.sign(
      { 
        id: admin.id, 
        role: 'admin',
        can_manage_admins: admin.can_manage_admins === 1
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    res.json({
      message: "Umefanikiwa kuingia",
      token,
      admin: {
        id: admin.id,
        first_name: admin.first_name,
        last_name: admin.last_name,
        mobile: admin.mobile,
        can_manage_admins: admin.can_manage_admins === 1
      }
    });

  } catch (err) {
    console.error("Admin Login Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ---------------------- ADMIN FORGOT PASSWORD ----------------------
exports.forgotPassword = async (req, res) => {
  try {
    const { first_name, last_name } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({ message: "Jina la kwanza na jina la mwisho vinahitajika" });
    }

    const [rows] = await db.query(
      "SELECT * FROM users WHERE first_name=? AND last_name=? AND is_admin=1 LIMIT 1",
      [first_name, last_name]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Msimamizi mwenye taarifa hizi hajapatikana" });
    }

    const admin = rows[0];

    const resetToken = jwt.sign(
      { id: admin.id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: "Umeidhinishwa kubadili nywila",
      reset_token: resetToken,
      next_step: "Tumia tokeni hii kubadili nywila yako"
    });

  } catch (err) {
    console.error("Admin Forgot Password Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ---------------------- RESET ADMIN PASSWORD ----------------------
exports.resetPassword = async (req, res) => {
  try {
    const { reset_token, new_password, confirm_password } = req.body;

    if (!reset_token || !new_password || !confirm_password) {
      return res.status(400).json({ message: "Tafadhali jaza sehemu zote" });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ message: "Nywila hazifanani" });
    }

    let decoded;
    try {
      decoded = jwt.verify(reset_token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: "Tokeni batili au imekwisha muda wake" });
    }

    if (decoded.type !== 'password_reset') {
      return res.status(400).json({ message: "Aina ya tokeni si sahihi" });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await db.query(
      "UPDATE users SET password=? WHERE id=?",
      [hashedPassword, decoded.id]
    );

    res.json({ message: "Umefanikiwa kubadili nywila. Sasa unaweza kuingia tena." });

  } catch (err) {
    console.error("Reset Admin Password Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ---------------------- CHANGE ADMIN MOBILE ----------------------
exports.changeMobile = async (req, res) => {
  try {
    const { first_name, last_name, new_mobile, confirm_mobile } = req.body;

    if (!first_name || !last_name || !new_mobile || !confirm_mobile) {
      return res.status(400).json({ message: "Tafadhali jaza sehemu zote" });
    }

    if (new_mobile !== confirm_mobile) {
      return res.status(400).json({ message: "Namba mpya hazifanani" });
    }

    const [rows] = await db.query(
      "SELECT * FROM users WHERE first_name=? AND last_name=? AND is_admin=1 LIMIT 1",
      [first_name, last_name]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Msimamizi mwenye taarifa hizi hajapatikana" });
    }

    const admin = rows[0];

    const [existing] = await db.query(
      "SELECT id FROM users WHERE mobile=? AND id!=?",
      [new_mobile, admin.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Namba hii ya simu imeshatumika" });
    }

    await db.query(
      "UPDATE users SET mobile=? WHERE id=?",
      [new_mobile, admin.id]
    );

    res.json({ message: "Namba ya simu imebadilishwa kikamilifu. Sasa unaweza kutumia namba mpya kuingia." });

  } catch (err) {
    console.error("Change Admin Mobile Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ---------------------- ADD NEW ADMIN ----------------------
exports.addAdmin = async (req, res) => {
  try {
    if (!req.admin.can_manage_admins) {
      return res.status(403).json({ message: "Ni msimamizi mkuu pekee anayeruhusiwa kuongeza wasimamizi wengine" });
    }

    const { first_name, last_name, mobile, password, confirm_password } = req.body;

    if (!first_name || !last_name || !mobile || !password || !confirm_password) {
      return res.status(400).json({ message: "Tafadhali jaza sehemu zote" });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ message: "Nywila hazifanani" });
    }

    const [existing] = await db.query("SELECT id FROM users WHERE mobile=?", [mobile]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Namba hii ya simu imeshasajiliwa" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (first_name, last_name, mobile, password, is_admin, can_manage_admins) VALUES (?, ?, ?, ?, 1, 0)",
      [first_name, last_name, mobile, hashedPassword]
    );

    res.status(201).json({ message: "Msimamizi ameongezwa kikamilifu" });

  } catch (err) {
    console.error("Add Admin Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ---------------------- UPDATE ADMIN ----------------------
exports.updateAdmin = async (req, res) => {
  try {
    if (!req.admin.can_manage_admins) {
      return res.status(403).json({ message: "Ni msimamizi mkuu pekee anayeruhusiwa kubadili taarifa za wasimamizi" });
    }

    const { id } = req.params;
    const { first_name, last_name, mobile, password } = req.body;

    const [adminRows] = await db.query("SELECT * FROM users WHERE id=? AND is_admin=1", [id]);
    if (adminRows.length === 0) {
      return res.status(404).json({ message: "Msimamizi hajapatikana" });
    }

    const updateFields = [];
    const updateValues = [];

    if (first_name) {
      updateFields.push("first_name=?");
      updateValues.push(first_name);
    }

    if (last_name) {
      updateFields.push("last_name=?");
      updateValues.push(last_name);
    }

    if (mobile) {
      const [existing] = await db.query(
        "SELECT id FROM users WHERE mobile=? AND id!=?",
        [mobile, id]
      );
      if (existing.length > 0) {
        return res.status(400).json({ message: "Namba hii ya simu imetumika tayari" });
      }
      updateFields.push("mobile=?");
      updateValues.push(mobile);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push("password=?");
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "Hakuna taarifa za kubadili" });
    }

    updateValues.push(id);
    const query = `UPDATE users SET ${updateFields.join(", ")} WHERE id=?`;

    await db.query(query, updateValues);

    res.json({ message: "Taarifa za msimamizi zimebadilishwa kikamilifu" });

  } catch (err) {
    console.error("Update Admin Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ---------------------- GET ALL ADMINS ----------------------
exports.getAdmins = async (req, res) => {
  try {
    if (!req.admin.can_manage_admins) {
      return res.status(403).json({ message: "Ni msimamizi mkuu pekee anayeruhusiwa kuona orodha ya wasimamizi" });
    }

    const [admins] = await db.query(
      "SELECT id, first_name, last_name, mobile, can_manage_admins, created_at FROM users WHERE is_admin=1 ORDER BY created_at DESC"
    );

    const safeAdmins = admins.map(admin => ({
      ...admin,
      can_manage_admins: admin.can_manage_admins === 1
    }));

    res.json(safeAdmins);

  } catch (err) {
    console.error("Get Admins Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ---------------------- DELETE ADMIN ----------------------
exports.deleteAdmin = async (req, res) => {
  try {
    if (!req.admin.can_manage_admins) {
      return res.status(403).json({ message: "Ni msimamizi mkuu pekee anayeruhusiwa kufuta wasimamizi" });
    }

    const { id } = req.params;

    if (parseInt(id) === 1) {
      return res.status(400).json({ message: "Huwezi kufuta msimamizi mkuu" });
    }

    const [adminRows] = await db.query("SELECT id FROM users WHERE id=? AND is_admin=1", [id]);
    if (adminRows.length === 0) {
      return res.status(404).json({ message: "Msimamizi hajapatikana" });
    }

    await db.query("DELETE FROM users WHERE id=?", [id]);

    res.json({ message: "Msimamizi amefutwa kikamilifu" });

  } catch (err) {
    console.error("Delete Admin Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};
