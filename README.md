
# JSONut

**JSONut** merupakan sistem informasi manajemen toko donat yang dikembangkan untuk membantu proses pengelolaan produk, persediaan stok, dan transaksi penjualan.

Sistem ini dirancang dengan konsep multi-platform yang terdiri dari Web Admin, Mobile App pelanggan, dan Desktop POS kasir. Ketiga platform direncanakan terintegrasi melalui backend dan basis data terpusat.

## Kredensial Login Web Admin

Gunakan akun demo berikut untuk mengakses Website Admin JSONut:

| Keterangan | Kredensial |
|---|---|
| Email | `admin@jsonut.com` |
| Password | `admin123` |

Akun tersebut disediakan untuk keperluan demonstrasi dan pengujian aplikasi.

## Fitur Utama

### 1. Dashboard

Menampilkan ringkasan informasi operasional toko, meliputi:
- Total jenis produk donat.
- Jumlah varian dengan stok yang perlu diperhatikan.
- Total persediaan fisik donat.

### 2. Manajemen Produk

- Menampilkan, menambahkan, mengubah, dan menghapus produk.
- Mencari produk berdasarkan nama.
- Mengelola harga, jumlah stok, dan foto produk.

### 3. Manajemen Stok

- Menampilkan jumlah stok setiap produk.
- Menampilkan status stok Habis, Menipis, dan Aman.
- Menyesuaikan jumlah stok produk.

### 4. Manajemen Transaksi

- Menampilkan daftar transaksi.
- Mencari transaksi berdasarkan ID.
- Memfilter transaksi berdasarkan tanggal.
- Melihat rincian transaksi.
- Mengelola status transaksi.

## Teknologi yang Digunakan

| Bagian | Teknologi |
|---|---|
| Frontend | React |
| Bahasa Pemrograman Frontend | TypeScript |
| Frontend Development Tool | Vite |
| Backend | Node.js |
| Backend Framework | Express.js |
| Database | SQLite |
| HTTP Client | Axios |
| File Upload | Multer |
| Password Hashing | bcrypt |

## Platform Sistem

| Platform | Deskripsi |
|---|---|
| Web Admin | Mengelola produk, persediaan stok, dan transaksi toko. |
| Mobile App Pelanggan | Dirancang untuk melihat katalog produk dan melakukan pemesanan. |
| Desktop POS Kasir | Dirancang untuk membantu transaksi penjualan secara langsung di toko. |

Saat ini, pengembangan difokuskan pada Web Admin. Mobile App pelanggan dan Desktop POS kasir merupakan bagian dari rancangan pengembangan selanjutnya.

## Struktur Proyek

```text
JSONut/
├── jsonut_web/    # Aplikasi Web Admin
└── server/        # Backend dan REST API
```

## Database

JSONut menggunakan SQLite dengan tabel utama:

| Tabel | Keterangan |
|---|---|
| `users` | Menyimpan informasi pengguna. |
| `products` | Menyimpan informasi produk donat. |
| `transactions` | Menyimpan data transaksi. |
| `transaction_details` | Menyimpan rincian produk dalam transaksi. |

## REST API

Backend JSONut menyediakan REST API untuk menghubungkan aplikasi frontend dengan basis data.

**Base URL**

```text
http://localhost:3000
```

### 1. User API

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/users` | Menampilkan seluruh pengguna. |
| GET | `/api/users/:id` | Menampilkan pengguna berdasarkan ID. |
| POST | `/api/users` | Menambahkan pengguna. |
| POST | `/api/users/login` | Melakukan autentikasi pengguna. |
| PUT | `/api/users/:id` | Mengubah data pengguna. |
| DELETE | `/api/users/:id` | Menghapus pengguna. |

### 2. Product API

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/products` | Menampilkan seluruh produk. |
| GET | `/api/products/:id` | Menampilkan produk berdasarkan ID. |
| POST | `/api/products` | Menambahkan produk. |
| POST | `/api/products/bulk` | Menambahkan beberapa produk sekaligus. |
| PUT | `/api/products/:id` | Mengubah data produk. |
| DELETE | `/api/products/:id` | Menghapus produk. |

### 3. Transaction API

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/transactions` | Menampilkan seluruh transaksi. |
| GET | `/api/transactions/:id` | Menampilkan transaksi berdasarkan ID. |
| POST | `/api/transactions` | Menambahkan transaksi. |
| PUT | `/api/transactions/:id` | Mengubah data transaksi. |
| DELETE | `/api/transactions/:id` | Menghapus transaksi. |

### 4. Transaction Detail API

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/transaction-details` | Menampilkan seluruh detail transaksi. |
| GET | `/api/transaction-details/:id` | Menampilkan detail berdasarkan ID. |
| GET | `/api/transaction-details/transaction/:transactionId` | Menampilkan detail berdasarkan ID transaksi. |
| POST | `/api/transaction-details` | Menambahkan detail transaksi. |
| PUT | `/api/transaction-details/:id` | Mengubah detail transaksi. |
| DELETE | `/api/transaction-details/:id` | Menghapus detail transaksi. |

**Catatan:** Endpoint menggunakan parameter dinamis seperti `:id` dan `:transactionId` sesuai dengan data yang diminta.

## Integrasi Sistem

Web Admin berkomunikasi dengan backend melalui REST API. Backend bertugas memproses permintaan aplikasi dan mengelola data pada basis data SQLite.

Dengan konsep basis data terpusat, pengembangan platform lainnya dapat menggunakan backend yang sama sehingga informasi sistem dapat dikelola secara terintegrasi.

## Menjalankan Proyek

JSONut terdiri dari aplikasi frontend dan backend yang dikembangkan secara terpisah. Keduanya perlu dijalankan dalam lingkungan pengembangan agar Web Admin dapat berkomunikasi dengan backend.

## Repository

Source code proyek JSONut dapat diakses melalui GitHub:

[GitHub - JSONut](https://github.com/samasamamas/jsonut)

---

**JSONut - Sistem Informasi Manajemen Toko Donat**
