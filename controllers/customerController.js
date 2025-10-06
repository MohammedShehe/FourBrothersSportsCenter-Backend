const db = require('../config/database');

exports.addCustomer = async (req, res) => {
  try {
    const { first_name, last_name, phone, email, gender } = req.body;

    if (!first_name || !last_name || !phone || !gender) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }
    // Check gender validity
    const validGenders = ["mwanaume", "mwanamke", "nyengine"];
    if (!validGenders.includes(gender.toLowerCase())) {
      return res.status(400).json({ message: "Invalid gender provided" });
    }

    const [existing] = await db.query("SELECT id FROM customers WHERE phone = ?", [phone]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Customer with this phone already exists" });
    }

    await db.query(
      "INSERT INTO customers (first_name, last_name, phone, email, gender) VALUES (?, ?, ?, ?, ?)",
      [first_name, last_name, phone, email || null, gender]
    );

    res.status(201).json({ message: "Customer added successfully" });
  } catch (err) {
    console.error("Add Customer Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getCustomers = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM customers ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error("Get Customers Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone, email, gender } = req.body;

    const [customer] = await db.query("SELECT * FROM customers WHERE id = ?", [id]);
    if (customer.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    await db.query(
      "UPDATE customers SET first_name=?, last_name=?, phone=?, email=?, gender=? WHERE id=?",
      [first_name, last_name, phone, email || null, gender, id]
    );

    res.json({ message: "Customer updated successfully" });
  } catch (err) {
    console.error("Update Customer Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const [customer] = await db.query("SELECT * FROM customers WHERE id = ?", [id]);
    if (customer.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    await db.query("DELETE FROM customers WHERE id = ?", [id]);
    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error("Delete Customer Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};