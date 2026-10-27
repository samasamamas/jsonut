-- Tabel Log (Opsional, untuk testing backend)
CREATE TABLE IF NOT EXISTS test_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO test_logs DEFAULT VALUES;

-- 1. TABEL PRODUK (Tanpa Kategori)
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABEL PENGGUNA (Untuk Admin, Kasir, dan Pelanggan Mobile)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'pelanggan', 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL TRANSAKSI (Header dari sebuah pesanan/struk)
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY, 
    user_id INTEGER,     
    total_amount REAL NOT NULL,
    payment_method TEXT, 
    status TEXT DEFAULT 'pending', 
    order_type TEXT DEFAULT 'offline', 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 4. TABEL DETAIL TRANSAKSI (Isi keranjang belanjaan)
CREATE TABLE IF NOT EXISTS transaction_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_time REAL NOT NULL, 
    subtotal REAL NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
