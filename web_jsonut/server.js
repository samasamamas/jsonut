const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Inisialisasi Database SQLite & Eksekusi init.sql
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Gagal terhubung ke database SQLite:', err.message);
    } else {
        console.log('Berhasil terhubung ke database SQLite.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    const initSqlPath = path.resolve(__dirname, 'sql_scripts', 'init.sql');
    if (fs.existsSync(initSqlPath)) {
        const sql = fs.readFileSync(initSqlPath, 'utf8');
        db.exec(sql, (err) => {
            if (err) {
                console.error('Gagal menjalankan init.sql:', err.message);
            } else {
                console.log('Skema database berhasil dimuat dari init.sql.');
            }
        });
    } else {
        console.warn('File sql_scripts/init.sql tidak ditemukan!');
    }
}

// ==========================================
// API ENDPOINTS PRODUK (JSONut)
// ==========================================

// 1. GET: Ambil semua produk
app.get('/api/products', (req, res) => {
    const query = "SELECT * FROM produk";
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, data: rows });
    });
});

// 2. GET: Ambil produk berdasarkan ID
app.get('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const query = "SELECT * FROM produk WHERE id_produk = ?";
    db.get(query, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        if (!row) {
            return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
        }
        res.json({ success: true, data: row });
    });
});

// 3. POST: Tambah satu produk baru
app.post('/api/products', (req, res) => {
    const { kode_produk, nama_produk, kategori, deskripsi, harga, stok, gambar_url, status_aktif } = req.body;
    
    if (!nama_produk || harga === undefined) {
        return res.status(400).json({ success: false, message: 'Nama produk dan harga wajib diisi' });
    }

    const query = `
        INSERT INTO produk (kode_produk, nama_produk, kategori, deskripsi, harga, stok, gambar_url, status_aktif)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        kode_produk || `DN-${Math.floor(100 + Math.random() * 900)}`,
        nama_produk,
        kategori || 'Donat Klasik',
        deskripsi || '',
        harga,
        stok || 0,
        gambar_url || '',
        status_aktif !== undefined ? status_aktif : 1
    ];

    db.run(query, params, function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.status(201).json({
            success: true,
            message: 'Produk berhasil dibuat',
            data: { id_produk: this.lastID, ...req.body }
        });
    });
});

// 4. PUT: Update produk
app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const { kode_produk, nama_produk, kategori, deskripsi, harga, stok, gambar_url, status_aktif } = req.body;

    const query = `
        UPDATE produk 
        SET kode_produk = ?, nama_produk = ?, kategori = ?, deskripsi = ?, harga = ?, stok = ?, gambar_url = ?, status_aktif = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id_produk = ?
    `;
    const params = [
        kode_produk,
        nama_produk,
        kategori,
        deskripsi,
        harga,
        stok,
        gambar_url,
        status_aktif !== undefined ? status_aktif : 1,
        id
    ];

    db.run(query, params, function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
        }
        res.json({ success: true, message: 'Produk berhasil diperbarui' });
    });
});

// 5. DELETE: Soft delete produk (status_aktif = 0)
app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const query = "UPDATE produk SET status_aktif = 0, updated_at = CURRENT_TIMESTAMP WHERE id_produk = ?";
    
    db.run(query, [id], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
        }
        res.json({ success: true, message: 'Produk berhasil dinonaktifkan (soft delete)' });
    });
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server API JSONut berjalan di http://localhost:${PORT}`);
});