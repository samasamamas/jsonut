
const db = require('../config/database');

// GET semua pesanan
const findAllTransactions = () => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM transactions ORDER BY created_at DESC`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
};

// GET pesanan berdasarkan ID
const findTransactionById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM transactions WHERE id = ?`,
      [id],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });
};

// CREATE pesanan
const createTransaction = (data) => {
  return new Promise((resolve, reject) => {
    const {
      id,
      user_id,
      total_amount,
      payment_method,
      status,
      order_type,
    } = data;

    db.run(
      `INSERT INTO transactions
       (id, user_id, total_amount, payment_method, status, order_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        user_id,
        total_amount,
        payment_method,
        status,
        order_type,
      ],
      function (err) {
        if (err) return reject(err);

        db.get(
          `SELECT * FROM transactions WHERE id = ?`,
          [id],
          (selectErr, row) => {
            if (selectErr) return reject(selectErr);
            resolve(row);
          }
        );
      }
    );
  });
};

// UPDATE pesanan
const updateTransaction = (id, data) => {
  return new Promise((resolve, reject) => {
    const allowedFields = [
      'user_id',
      'total_amount',
      'payment_method',
      'status',
      'order_type',
    ];

    const fields = [];
    const values = [];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) {
      return findTransactionById(id).then(resolve).catch(reject);
    }

    values.push(id);

    db.run(
      `UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`,
      values,
      function (err) {
        if (err) return reject(err);

        if (this.changes === 0) {
          return findTransactionById(id)
            .then(resolve)
            .catch(reject);
        }

        findTransactionById(id).then(resolve).catch(reject);
      }
    );
  });
};

// DELETE pesanan
const deleteTransaction = (id) => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM transactions WHERE id = ?`,
      [id],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      }
    );
  });
};

module.exports = {
  findAllTransactions,
  findTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
