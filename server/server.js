
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const {
  db,
  initializeDatabase,
} = require('./src/config/database');

const testRoutes = require('./src/routes/test');
const productRoutes = require('./src/routes/productRoutes');
const userRoutes = require('./src/routes/userRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const transactionDetailRoutes = require('./src/routes/transactionDetailRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

/* ==========================================
 * MIDDLEWARE: CORS
 * ========================================== */

const corsOptions = process.env.CLIENT_URL
  ? {
      origin: process.env.CLIENT_URL
        .split(',')
        .map((url) => url.trim()),
    }
  : {};

app.use(cors(corsOptions));

/* ==========================================
 * MIDDLEWARE: REQUEST BODY
 * ========================================== */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ==========================================
 * STATIC: FOTO PRODUK
 * ========================================== */

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

/* ==========================================
 * ROOT ROUTE
 * ========================================== */

app.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'JSONut API is running',
    endpoints: {
      '/api/test': 'Pengujian koneksi server',
      '/api/users': 'Manajemen pengguna dan login',
      '/api/products': 'Manajemen produk',
      '/api/transactions': 'Manajemen transaksi',
      '/api/transaction-details': 'Manajemen detail transaksi',
    },
  });
});

/* ==========================================
 * API ROUTES
 * ========================================== */

app.use('/api/test', testRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/transaction-details', transactionDetailRoutes);

/* ==========================================
 * 404: ENDPOINT TIDAK DITEMUKAN
 * ========================================== */

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
    path: req.originalUrl,
  });
});

/* ==========================================
 * ERROR HANDLER
 * ========================================== */

app.use((error, req, res, next) => {
  console.error('[Server Error]', error);

  if (res.headersSent) {
    return next(error);
  }

  // Menangani request JSON yang tidak valid.
  if (
    error instanceof SyntaxError &&
    error.status === 400 &&
    'body' in error
  ) {
    return res.status(400).json({
      success: false,
      message: 'Format JSON request tidak valid.',
    });
  }

  const statusCode =
    error.status || error.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500
        ? 'Terjadi kesalahan pada server.'
        : error.message || 'Permintaan tidak dapat diproses.',
  });
});

/* ==========================================
 * MENJALANKAN SERVER
 * ========================================== */

const startServer = async () => {
  try {
    // Pastikan database dan migrasi selesai terlebih dahulu.
    await initializeDatabase();

    console.log('Database berhasil diinisialisasi');

    const server = app.listen(PORT, () => {
      console.log(
        `JSONut Server berjalan di http://localhost:${PORT}`
      );
    });

    server.on('error', (error) => {
      console.error(
        'Gagal menjalankan HTTP server:',
        error
      );
    });

    // Menangani penghentian server.
    const shutdown = () => {
      console.log('Menutup JSONut Server...');

      server.close(() => {
        db.close((error) => {
          if (error) {
            console.error(
              'Gagal menutup database:',
              error.message
            );
            process.exit(1);
          }

          console.log('Koneksi database ditutup');
          process.exit(0);
        });
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    console.error(
      'Gagal menjalankan server:',
      error
    );

    db.close(() => {
      process.exit(1);
    });
  }
};

startServer();
