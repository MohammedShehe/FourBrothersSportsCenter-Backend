const db = require('../config/database');
const cloudinary = require('../config/cloudinary');

// Allowed product types
const validTypes = ['Njumu', 'Trainer', 'Njumu na Trainer'];

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "products" }, // Cloudinary folder
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};

// ==========================
// ADD PRODUCT
// ==========================
exports.addProduct = async (req, res) => {
  try {
    const { name, company, color, discount_percent, type, size_us, stock, price } = req.body;

    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid product type" });
    }

    const [result] = await db.query(
      `INSERT INTO products (name, company, color, discount_percent, type, size_us, stock, price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, company, color, discount_percent, type, size_us, stock, price]
    );

    const productId = result.insertId;

    // Upload images to Cloudinary
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));

      const imageUrls = await Promise.all(uploadPromises);

      const insertPromises = imageUrls.map(url =>
        db.query("INSERT INTO product_images (product_id, image_url) VALUES (?, ?)", [productId, url])
      );

      await Promise.all(insertPromises);
    }

    res.status(201).json({ message: "Product added successfully", product_id: productId });

  } catch (err) {
    console.error("Add Product Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==========================
// GET PRODUCTS
// ==========================
exports.getProducts = async (req, res) => {
  try {
    const [products] = await db.query("SELECT * FROM products ORDER BY created_at DESC");

    for (let product of products) {
      const [images] = await db.query(
        "SELECT image_url FROM product_images WHERE product_id=?",
        [product.id]
      );
      product.images = images.map(img => img.image_url);
    }

    res.json(products);
  } catch (err) {
    console.error("Get Products Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==========================
// UPDATE PRODUCT
// ==========================
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, company, color, discount_percent, type, size_us, stock, price } = req.body;

    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid product type" });
    }

    await db.query(
      `UPDATE products SET name=?, company=?, color=?, discount_percent=?, type=?, size_us=?, stock=?, price=? 
       WHERE id=?`,
      [name, company, color, discount_percent, type, size_us, stock, price, id]
    );

    if (req.files && req.files.length > 0) {
      // Delete old images
      await db.query("DELETE FROM product_images WHERE product_id=?", [id]);

      // Upload new images
      const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
      const imageUrls = await Promise.all(uploadPromises);

      const insertPromises = imageUrls.map(url =>
        db.query("INSERT INTO product_images (product_id, image_url) VALUES (?, ?)", [id, url])
      );

      await Promise.all(insertPromises);
    }

    res.json({ message: "Product updated successfully" });

  } catch (err) {
    console.error("Update Product Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==========================
// DELETE PRODUCT
// ==========================
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete product — images are not deleted from Cloudinary (optional)
    await db.query("DELETE FROM products WHERE id=?", [id]);

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete Product Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
