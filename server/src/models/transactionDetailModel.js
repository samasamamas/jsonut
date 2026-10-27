
const db = require('../config/database');

// GET semua detail pesanan
const findAllTransactionDetails = () => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT 
        td.*,
        p.name AS product_name
       FROM transaction_details td
       LEFT JOIN products p ON td.product_id = p.id
       ORDER BY td.id DESC`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
};

// GET detail berdasarkan ID
const findTransactionDetailById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT 
        td.*,
        p.name AS product_name
       FROM transaction_details td
       LEFT JOIN products p ON td.product_id = p.id
       WHERE td.id = ?`,
      [id],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });
};

// GET semua detail berdasarkan ID pesanan
const findDetailsByTransactionId = (transactionId) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT 
        td.*,
        p.name AS product_name
       FROM transaction_details td
       LEFT JOIN products p ON td.product_id = p.id
       WHERE td.transaction_id = ?
       ORDER BY td.id ASC`,
      [transactionId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
};

// CREATE detail pesanan
const createTransactionDetail = (data) => {
  return new Promise((resolve, reject) => {
    const {
      transaction_id,
      product_id,
      quantity,
      price_at_time,
      subtotal,
    } = data;

    db.run(
      `INSERT INTO transaction_details
        (transaction_id, product_id, quantity, price_at_time, subtotal)
       VALUES (?, ?, ?, ?, ?)`,
      [
        transaction_id,
        product_id,
        quantity,
        price_at_time,
        subtotal,
      ],
      function (err) {
        if (err) return reject(err);

        findTransactionDetailById(this.lastID)
          .then(resolve)
          .catch(reject);
      }
    );
  });
};

// UPDATE detail pesanan
const updateTransactionDetail = (id, data) => {
  return new Promise((resolve, reject) => {
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
      return findTransactionDetailById(id)
        .then(resolve)
        .catch(reject);
    }

    // Hitung ulang subtotal berdasarkan nilai baru
    fields.push('subtotal = quantity * price_at_time');

    values.push(id);

    db.run(
      `UPDATE transaction_details
       SET ${fields.join(', ')}
       WHERE id = ?`,
      values,
      function (err) {
        if (err) return reject(err);

        findTransactionDetailById(id)
          .then(resolve)
          .catch(reject);
      }
    );
  });
};

// DELETE satu detail produk
const deleteTransactionDetail = (id) => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM transaction_details WHERE id = ?`,
      [id],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      }
    );
  });
};

module.exports = {
  findAllTransactionDetails,
  findTransactionDetailById,
  findDetailsByTransactionId,
  createTransactionDetail,
  updateTransactionDetail,
  deleteTransactionDetail,
};
