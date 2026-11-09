
const { db } = require('../config/database');

/* ==========================================
 * HELPER: Jalankan query
 * ========================================== */

const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) return reject(err);

      resolve({
        lastID: this.lastID,
        changes: this.changes,
      });
    });
  });
};

const getQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
};

const allQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

/* ==========================================
 * HELPER: Sinkronisasi total transaksi
 * ========================================== */

const updateTransactionTotal = async (transactionId) => {
  await runQuery(
    `UPDATE transactions
     SET total_amount = (
       SELECT COALESCE(SUM(subtotal), 0)
       FROM transaction_details
       WHERE transaction_id = ?
     )
     WHERE id = ?`,
    [transactionId, transactionId]
  );
};

/* ==========================================
 * READ: Semua detail pesanan
 * ========================================== */

const findAllTransactionDetails = async () => {
  return await allQuery(
    `SELECT
      td.*,
      p.name AS product_name
     FROM transaction_details td
     LEFT JOIN products p ON td.product_id = p.id
     ORDER BY td.id DESC`
  );
};

/* ==========================================
 * READ: Detail berdasarkan ID
 * ========================================== */

const findTransactionDetailById = async (id) => {
  return await getQuery(
    `SELECT
      td.*,
      p.name AS product_name
     FROM transaction_details td
     LEFT JOIN products p ON td.product_id = p.id
     WHERE td.id = ?`,
    [id]
  );
};

/* ==========================================
 * READ: Detail berdasarkan ID transaksi
 * ========================================== */

const findDetailsByTransactionId = async (transactionId) => {
  return await allQuery(
    `SELECT
      td.*,
      p.name AS product_name
     FROM transaction_details td
     LEFT JOIN products p ON td.product_id = p.id
     WHERE td.transaction_id = ?
     ORDER BY td.id ASC`,
    [transactionId]
  );
};

/* ==========================================
 * CREATE: Tambah detail pesanan
 * ========================================== */

const createTransactionDetail = async (data) => {
  const {
    transaction_id,
    product_id,
    quantity,
    price_at_time,
    subtotal,
  } = data;

  const result = await runQuery(
    `INSERT INTO transaction_details
      (transaction_id, product_id, quantity, price_at_time, subtotal)
     VALUES (?, ?, ?, ?, ?)`,
    [
      transaction_id,
      product_id,
      quantity,
      price_at_time,
      subtotal,
    ]
  );

  // Perbarui total transaksi setelah detail berhasil ditambahkan.
  await updateTransactionTotal(transaction_id);

  return await findTransactionDetailById(result.lastID);
};

/* ==========================================
 * UPDATE: Perbarui detail pesanan
 * ========================================== */

const updateTransactionDetail = async (id, data) => {
  const existing = await getQuery(
    `SELECT * FROM transaction_details WHERE id = ?`,
    [id]
  );

  if (!existing) {
    return null;
  }

  const fields = [];
  const values = [];

  if (data.quantity !== undefined) {
    fields.push('quantity = ?');
    values.push(data.quantity);
  }

  if (data.price_at_time !== undefined) {
    fields.push('price_at_time = ?');
    values.push(data.price_at_time);
  }

  if (fields.length === 0) {
    return await findTransactionDetailById(id);
  }

  // Hitung ulang subtotal berdasarkan jumlah dan harga terbaru.
  fields.push('subtotal = quantity * price_at_time');

  values.push(id);

  await runQuery(
    `UPDATE transaction_details
     SET ${fields.join(', ')}
     WHERE id = ?`,
    values
  );

  // Perbarui total transaksi setelah detail berhasil diubah.
  await updateTransactionTotal(existing.transaction_id);

  return await findTransactionDetailById(id);
};

/* ==========================================
 * DELETE: Hapus detail pesanan
 * ========================================== */

const deleteTransactionDetail = async (id) => {
  const existing = await getQuery(
    `SELECT transaction_id
     FROM transaction_details
     WHERE id = ?`,
    [id]
  );

  if (!existing) {
    return false;
  }

  await runQuery(
    `DELETE FROM transaction_details WHERE id = ?`,
    [id]
  );

  // Perbarui total transaksi setelah detail dihapus.
  await updateTransactionTotal(existing.transaction_id);

  return true;
};

module.exports = {
  findAllTransactionDetails,
  findTransactionDetailById,
  findDetailsByTransactionId,
  createTransactionDetail,
  updateTransactionDetail,
  deleteTransactionDetail,
};
