const db = require('../config/database');

// Allowed product types
const validTypes = ['Njumu', 'Trainer', 'Njumu na Trainer'];

// Add Product
exports.addProduct = async (req, res) => {
  try {
    const { name, company, color, discount_percent, type, size_us, stock, price } = req.body;

    // Validate product type
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid product type. Must be Njumu, Trainer, or Njumu na Trainer." });
    }

    const [result] = await db.query(
      `INSERT INTO products (name, company, color, discount_percent, type, size_us, stock, price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, company, color, discount_percent, type, size_us, stock, price]
    );

    const productId = result.insertId;

    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map(file =>
        db.query("INSERT INTO product_images (product_id, image_url) VALUES (?, ?)", [
          productId, `/uploads/products/${file.filename}`
        ])
      );
      await Promise.all(imagePromises);
    }

    res.status(201).json({ message: "Product added successfully", product_id: productId });
  } catch (err) {
    console.error("Add Product Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Products
exports.getProducts = async (req, res) => {
  try {
    const [products] = await db.query("SELECT * FROM products ORDER BY created_at DESC");

    for (let product of products) {
      const [images] = await db.query("SELECT image_url FROM product_images WHERE product_id=?", [product.id]);
      product.images = images.map(img => img.image_url);
    }

    res.json(products);
  } catch (err) {
    console.error("Get Products Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, company, color, discount_percent, type, size_us, stock, price } = req.body;

    // Validate product type
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid product type. Must be Njumu, Trainer, or Njumu na Trainer." });
    }

    await db.query(
      `UPDATE products SET name=?, company=?, color=?, discount_percent=?, type=?, size_us=?, stock=?, price=? WHERE id=?`,
      [name, company, color, discount_percent, type, size_us, stock, price, id]
    );

    if (req.files && req.files.length > 0) {
      await db.query("DELETE FROM product_images WHERE product_id=?", [id]);
      const imagePromises = req.files.map(file =>
        db.query("INSERT INTO product_images (product_id, image_url) VALUES (?, ?)", [
          id, `/uploads/products/${file.filename}`
        ])
      );
      await Promise.all(imagePromises);
    }

    res.json({ message: "Product updated successfully" });
  } catch (err) {
    console.error("Update Product Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM products WHERE id=?", [id]);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete Product Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
