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
// ADD PRODUCT (Updated for multiple sizes)
// ==========================
exports.addProduct = async (req, res) => {
  try {
    const { 
      name, 
      company, 
      color, 
      discount_percent, 
      type, 
      price, 
      description,
      sizes // New: JSON string containing sizes and stocks
    } = req.body;

    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Aina ya bidhaa si sahihi" });
    }

    // Parse sizes if provided
    let sizeData = [];
    if (sizes) {
      try {
        sizeData = JSON.parse(sizes);
      } catch (err) {
        return res.status(400).json({ message: "Maelezo ya saizi si sahihi" });
      }
    }

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Insert product
      const [productResult] = await connection.query(
        `INSERT INTO products (name, company, color, discount_percent, type, price, description)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, company, color, discount_percent, type, price, description || null]
      );

      const productId = productResult.insertId;

      // Insert sizes with quantities
      if (sizeData.length > 0) {
        const sizePromises = sizeData.map(size => {
          return connection.query(
            `INSERT INTO product_sizes (product_id, size_code, size_label, stock) 
             VALUES (?, ?, ?, ?)`,
            [productId, size.code, size.label, size.stock || 0]
          );
        });
        await Promise.all(sizePromises);
      } else {
        // Add default size if none provided
        await connection.query(
          `INSERT INTO product_sizes (product_id, size_code, size_label, stock) 
           VALUES (?, ?, ?, ?)`,
          [productId, 'M', 'Medium', 0]
        );
      }

      // Upload images to Cloudinary
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
        const imageUrls = await Promise.all(uploadPromises);

        const insertPromises = imageUrls.map(url =>
          connection.query("INSERT INTO product_images (product_id, image_url) VALUES (?, ?)", [productId, url])
        );

        await Promise.all(insertPromises);
      }

      await connection.commit();
      res.status(201).json({ 
        message: "Bidhaa imeongezwa kikamilifu", 
        product_id: productId 
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (err) {
    console.error("Add Product Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ==========================
// GET PRODUCTS (Updated for multiple sizes)
// ==========================
exports.getProducts = async (req, res) => {
  try {
    const [products] = await db.query("SELECT * FROM products ORDER BY created_at DESC");

    for (let product of products) {
      // Get images
      const [images] = await db.query(
        "SELECT image_url FROM product_images WHERE product_id=?",
        [product.id]
      );
      product.images = images.map(img => img.image_url);

      // Get sizes with stock
      const [sizes] = await db.query(
        "SELECT id, size_code, size_label, stock FROM product_sizes WHERE product_id=? ORDER BY size_code",
        [product.id]
      );
      product.sizes = sizes;

      // Calculate total stock
      product.total_stock = sizes.reduce((sum, size) => sum + (size.stock || 0), 0);
    }

    res.json(products);
  } catch (err) {
    console.error("Get Products Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
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
      return res.status(400).json({ message: "Aina ya bidhaa si sahihi" });
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

    res.json({ message: "Bidhaa imesasishwa kikamilifu" });

  } catch (err) {
    console.error("Update Product Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
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

    res.json({ message: "Bidhaa imefutwa kikamilifu" });
  } catch (err) {
    console.error("Delete Product Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};
// ==========================
// GET PRODUCT SIZES
// ==========================
exports.getProductSizes = async (req, res) => {
  try {
    const { product_id } = req.params;
    
    const [sizes] = await db.query(
      "SELECT id, size_code, size_label, stock FROM product_sizes WHERE product_id=? ORDER BY size_code",
      [product_id]
    );
    
    res.json(sizes);
  } catch (err) {
    console.error("Get Product Sizes Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};

// ==========================
// UPDATE SIZE STOCK
// ==========================
exports.updateSizeStock = async (req, res) => {
  try {
    const { size_id } = req.params;
    const { stock } = req.body;
    
    await db.query(
      "UPDATE product_sizes SET stock=? WHERE id=?",
      [stock, size_id]
    );
    
    res.json({ message: "Akiba ya saizi imesasishwa kikamilifu" });
  } catch (err) {
    console.error("Update Size Stock Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};