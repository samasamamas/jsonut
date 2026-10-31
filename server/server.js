require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const { initializeDatabase } = require('./src/config/database');

const testRoutes = require('./src/routes/test');
const productRoutes = require('./src/routes/productRoutes');
const userRoutes = require('./src/routes/userRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const transactionDetailRoutes = require('./src/routes/transactionDetailRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

/* Middleware */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Static folder untuk foto produk */
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

/* Root route */
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Product API is running',
    endpoints: {
      'GET    /api/products': 'Ambil semua produk',
      'GET    /api/products/:id': 'Ambil produk by id',
      'POST   /api/products': 'Buat produk baru',
      'PUT    /api/products/:id': 'Update produk',
      'DELETE /api/products/:id': 'Hapus produk',
      'GET    /uploads/products/:filename': 'Ambil foto produk',
    },
  });
});

/* Routes */
app.use('/api/test', testRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/transaction-details', transactionDetailRoutes);

/* 404 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
  });
});

/* Start */
(async () => {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Server: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Gagal menjalankan server:', error);
    process.exit(1);
  }
})();