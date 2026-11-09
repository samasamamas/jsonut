
const transactionModel = require('../models/transactionModel');

/* ==========================================
 * HELPER: Standard response
 * ========================================== */

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

/* ==========================================
 * HELPER: Validasi
 * ========================================== */

const ALLOWED_STATUSES = [
  'diproses',
  'selesai',
  'dibatalkan',
];

const ALLOWED_PAYMENT_METHODS = [
  'tunai',
  'transfer',
  'qris',
  'cash',
  'transfer bank',
];

const ALLOWED_ORDER_TYPES = [
  'offline',
  'online',
];

/* ==========================================
 * HELPER: Konversi dan validasi angka
 * ========================================== */

// Mengubah nilai angka dari x-www-form-urlencoded
// maupun raw JSON menjadi number.
const toNumber = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : null;
};

// Validasi total pesanan.
const isValidTotal = (value) => {
  const numericValue = toNumber(value);

  return (
    numericValue !== null &&
    numericValue >= 0
  );
};

// Konversi ID pengguna.
const normalizeUserId = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  const numericValue = Number(value);

  if (
    !Number.isInteger(numericValue) ||
    numericValue <= 0
  ) {
    return undefined;
  }

  return numericValue;
};

// Validasi ID pengguna.
const isValidUserId = (value) => {
  return (
    value === null ||
    (
      Number.isInteger(value) &&
      value > 0
    )
  );
};

// Validasi string opsional.
const isValidOptionalString = (value) =>
  value === null ||
  (
    typeof value === 'string' &&
    value.trim().length > 0
  );

/* ==========================================
 * GET: Semua pesanan
 * ========================================== */

const getAllTransactions = async (req, res) => {
  try {
    const transactions =
      await transactionModel.findAllTransactions();

    return success(
      res,
      200,
      'Berhasil mengambil semua pesanan',
      transactions
    );
  } catch (error) {
    console.error('[getAllTransactions]', error);

    return fail(
      res,
      500,
      'Server Error'
    );
  }
};

/* ==========================================
 * GET: Pesanan berdasarkan ID
 * ========================================== */

const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction =
      await transactionModel.findTransactionById(id);

    if (!transaction) {
      return fail(
        res,
        404,
        'Pesanan tidak ditemukan'
      );
    }

    return success(
      res,
      200,
      'Berhasil mengambil pesanan',
      transaction
    );
  } catch (error) {
    console.error('[getTransactionById]', error);

    return fail(
      res,
      500,
      'Server Error'
    );
  }
};

/* ==========================================
 * POST: Membuat pesanan
 * ========================================== */

const createTransaction = async (req, res) => {
  try {
    const {
      id,
      user_id,
      total_amount,
      payment_method,
      status,
      order_type,
    } = req.body || {};

    // Validasi ID pesanan.
    if (
      typeof id !== 'string' ||
      !id.trim()
    ) {
      return fail(
        res,
        400,
        'ID pesanan wajib diisi'
      );
    }

    // Validasi total pesanan.
    if (!isValidTotal(total_amount)) {
      return fail(
        res,
        400,
        'Total pesanan tidak valid'
      );
    }

    // Konversi ID pengguna.
    const finalUserId = normalizeUserId(user_id);

    // Validasi ID pengguna.
    if (
      user_id !== undefined &&
      user_id !== null &&
      user_id !== '' &&
      finalUserId === undefined
    ) {
      return fail(
        res,
        400,
        'ID pengguna tidak valid'
      );
    }

    // Validasi metode pembayaran.
    if (
      payment_method !== undefined &&
      !isValidOptionalString(payment_method)
    ) {
      return fail(
        res,
        400,
        'Metode pembayaran tidak valid'
      );
    }

    // Validasi status pesanan.
    const finalStatus = status ?? 'pending';

    if (
      typeof finalStatus !== 'string' ||
      !ALLOWED_STATUSES.includes(finalStatus)
    ) {
      return fail(
        res,
        400,
        'Status pesanan tidak valid'
      );
    }

    // Validasi jenis pesanan.
    const finalOrderType = order_type ?? 'offline';

    if (
      typeof finalOrderType !== 'string' ||
      !ALLOWED_ORDER_TYPES.includes(finalOrderType)
    ) {
      return fail(
        res,
        400,
        'Jenis pesanan tidak valid'
      );
    }

    const transaction =
      await transactionModel.createTransaction({
        id: id.trim(),
        user_id: finalUserId,
        total_amount: Number(total_amount),
        payment_method: payment_method ?? null,
        status: finalStatus,
        order_type: finalOrderType,
      });

    return success(
      res,
      201,
      'Pesanan berhasil dibuat',
      transaction
    );

  } catch (error) {
    console.error('[createTransaction]', error);

    if (
      error.message?.includes('UNIQUE constraint failed')
    ) {
      return fail(
        res,
        409,
        'ID pesanan sudah digunakan'
      );
    }

    if (
      error.message?.includes('FOREIGN KEY constraint failed')
    ) {
      return fail(
        res,
        400,
        'Pengguna tidak ditemukan'
      );
    }

    return fail(
      res,
      500,
      'Server Error'
    );
  }
};

/* ==========================================
 * PUT: Memperbarui pesanan
 * ========================================== */

const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      user_id,
      total_amount,
      payment_method,
      status,
      order_type,
    } = req.body || {};


    if (
      user_id === undefined &&
      total_amount === undefined &&
      payment_method === undefined &&
      status === undefined &&
      order_type === undefined
    ) {
      return fail(
        res,
        400,
        'Tidak ada data yang diperbarui'
      );
    }

    // Validasi dan konversi total pesanan.
    let finalTotalAmount;

    if (total_amount !== undefined) {
      if (!isValidTotal(total_amount)) {
        return fail(
          res,
          400,
          'Total pesanan tidak valid'
        );
      }

      finalTotalAmount = Number(total_amount);
    }

    // Validasi dan konversi ID pengguna.
    let finalUserId;

    if (user_id !== undefined) {
      finalUserId = normalizeUserId(user_id);

      if (
        user_id !== null &&
        user_id !== '' &&
        finalUserId === undefined
      ) {
        return fail(
          res,
          400,
          'ID pengguna tidak valid'
        );
      }
    }

    // Validasi metode pembayaran.
    if (
      payment_method !== undefined &&
      !isValidOptionalString(payment_method)
    ) {
      return fail(
        res,
        400,
        'Metode pembayaran tidak valid'
      );
    }

    // Validasi status.
    if (
      status !== undefined &&
      (
        typeof status !== 'string' ||
        !ALLOWED_STATUSES.includes(status)
      )
    ) {
      return fail(
        res,
        400,
        'Status pesanan tidak valid'
      );
    }

    // Validasi jenis pesanan.
    if (
      order_type !== undefined &&
      (
        typeof order_type !== 'string' ||
        !ALLOWED_ORDER_TYPES.includes(order_type)
      )
    ) {
      return fail(
        res,
        400,
        'Jenis pesanan tidak valid'
      );
    }

    const updateData = {
      user_id: finalUserId,
      total_amount: finalTotalAmount,
      payment_method,
      status,
      order_type,
    };

   
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updated =
      await transactionModel.updateTransaction(
        id,
        updateData
      );

    if (!updated) {
      return fail(
        res,
        404,
        'Pesanan tidak ditemukan'
      );
    }

    return success(
      res,
      200,
      'Pesanan berhasil diperbarui',
      updated
    );

  } catch (error) {
    console.error('[updateTransaction]', error);

    if (
      error.message?.includes('FOREIGN KEY constraint failed')
    ) {
      return fail(
        res,
        400,
        'Pengguna tidak ditemukan'
      );
    }

    return fail(
      res,
      500,
      'Server Error'
    );
  }
};

/* ==========================================
 * DELETE: Menghapus pesanan
 * ========================================== */

const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted =
      await transactionModel.deleteTransaction(id);

    if (!deleted) {
      return fail(
        res,
        404,
        'Pesanan tidak ditemukan'
      );
    }

    return success(
      res,
      200,
      'Pesanan berhasil dihapus'
    );

  } catch (error) {
    console.error('[deleteTransaction]', error);

    if (
      error.message?.includes('FOREIGN KEY constraint failed')
    ) {
      return fail(
        res,
        409,
        'Pesanan masih memiliki detail atau data terkait'
      );
    }

    return fail(
      res,
      500,
      'Server Error'
    );
  }
};

/* ==========================================
 * EXPORT
 * ========================================== */

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
