// config/multer.js
const multer = require('multer');

// Store file in memory (RAM)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max per file
  fileFilter: (req, file, cb) => {
    const allowedMime = ["image/jpeg", "image/jpg", "image/png"];
    if (allowedMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (jpg, jpeg, png) are allowed"));
    }
  }
});

module.exports = upload;
