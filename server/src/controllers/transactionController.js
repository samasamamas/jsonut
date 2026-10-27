
const transactionModel = require('../models/transactionModel');

const success = (res, code, message, data = null) =>
  res.status(code).json({
    success: true,
    message,
    data,
  });

const fail = (res, code, message, error = null) =>
  res.status(code).json({
    success: false,
    message,
    error,
  });

// GET semua pesanan
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await transactionModel.findAllTransactions();

    return success(
      res,
      200,
      'Berhasil mengambil semua pesanan',
      transactions
    );
  } catch (error) {
    console.error('[getAllTransactions]', error);
    return fail(res, 500, 'Server Error');
  }
};

// GET pesanan berdasarkan ID
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await transactionModel.findTransactionById(id);

    if (!transaction) {
      return fail(res, 404, 'Pesanan tidak ditemukan');
    }

    return success(res, 200, 'Berhasil mengambil pesanan', transaction);
  } catch (error) {
    console.error('[getTransactionById]', error);
    return fail(res, 500, 'Server Error');
  }
};

// POST membuat pesanan
const createTransaction = async (req, res) => {
  try {
    const {
      id,
      user_id,
      total_amount,
      payment_method,
      status,
      order_type,
    } = req.body;

    if (!id || typeof id !== 'string' || !id.trim()) {
      return fail(res, 400, 'ID pesanan wajib diisi');
    }

    if (
      total_amount === undefined ||
      !Number.isFinite(total_amount) ||
      total_amount < 0
    ) {
      return fail(res, 400, 'Total pesanan tidak valid');
    }

    if (user_id !== undefined && user_id !== null &&
        (!Number.isInteger(user_id) || user_id <= 0)) {
      return fail(res, 400, 'ID pengguna tidak valid');
    }

    const transaction = await transactionModel.createTransaction({
      id: id.trim(),
      user_id: user_id ?? null,
      total_amount,
      payment_method: payment_method ?? null,
      status: status ?? 'pending',
      order_type: order_type ?? 'offline',
    });

    return success(res, 201, 'Pesanan berhasil dibuat', transaction);
  } catch (error) {
    console.error('[createTransaction]', error);

    if (error.message?.includes('UNIQUE constraint failed')) {
      return fail(res, 409, 'ID pesanan sudah digunakan');
    }

    if (error.message?.includes('FOREIGN KEY constraint failed')) {
      return fail(res, 400, 'Pengguna tidak ditemukan');
    }

    return fail(res, 500, 'Server Error');
  }
};

// PUT memperbarui pesanan
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      user_id,
      total_amount,
      payment_method,
      status,
      order_type,
    } = req.body;

    if (total_amount !== undefined &&
        (!Number.isFinite(total_amount) || total_amount < 0)) {
      return fail(res, 400, 'Total pesanan tidak valid');
    }

    if (user_id !== undefined && user_id !== null &&
        (!Number.isInteger(user_id) || user_id <= 0)) {
      return fail(res, 400, 'ID pengguna tidak valid');
    }

    const updated = await transactionModel.updateTransaction(id, {
      user_id,
      total_amount,
      payment_method,
      status,
      order_type,
    });

    if (!updated) {
      return fail(res, 404, 'Pesanan tidak ditemukan');
    }

    return success(res, 200, 'Pesanan berhasil diperbarui', updated);
  } catch (error) {
    console.error('[updateTransaction]', error);

    if (error.message?.includes('FOREIGN KEY constraint failed')) {
      return fail(res, 400, 'Pengguna tidak ditemukan');
    }

    return fail(res, 500, 'Server Error');
  }
};

// DELETE menghapus pesanan
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await transactionModel.deleteTransaction(id);

    if (!deleted) {
      return fail(res, 404, 'Pesanan tidak ditemukan');
    }

    return success(res, 200, 'Pesanan berhasil dihapus');
  } catch (error) {
    console.error('[deleteTransaction]', error);

    if (error.message?.includes('FOREIGN KEY constraint failed')) {
      return fail(
        res,
        409,
        'Pesanan masih memiliki detail atau data terkait'
      );
    }

    return fail(res, 500, 'Server Error');
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
