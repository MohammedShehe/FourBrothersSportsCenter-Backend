// config/multer.js
const multer = require('multer');
const path = require('path');

// Use memory storage (files stored in RAM)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max per image
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed (jpg, jpeg, png)'));
    }
  }
});

module.exports = upload;
