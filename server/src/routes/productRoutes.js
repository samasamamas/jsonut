const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const productController = require('../controllers/productController');

// Pastikan folder upload tersedia
const uploadDir = path.join(__dirname, '../../uploads/products');
fs.mkdirSync(uploadDir, { recursive: true });

// Konfigurasi penyimpanan foto
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

// Validasi format foto
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format foto harus JPG, PNG, atau WEBP'));
  }
};

// Konfigurasi Multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// GET semua produk
router.get('/', productController.getAllProducts);

// GET produk berdasarkan ID
router.get('/:id', productController.getProductById);

// BULK create tanpa upload foto
router.post('/bulk', productController.bulkCreateProducts);

// POST tambah produk dengan foto opsional
router.post(
  '/',
  upload.single('image'),
  productController.createProduct
);

// PUT edit produk dengan foto opsional
router.put(
  '/:id',
  upload.single('image'),
  productController.updateProduct
);

// DELETE produk
router.delete('/:id', productController.deleteProduct);

// Penanganan error Multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message:
        error.code === 'LIMIT_FILE_SIZE'
          ? 'Ukuran foto maksimal 5 MB'
          : error.message,
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next();
});

module.exports = router;