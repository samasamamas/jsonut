
const transactionDetailModel = require('../models/transactionDetailModel');

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
 * HELPER: Validasi angka
 * ========================================== */

const isPositiveInteger = (value) =>
  Number.isInteger(Number(value)) &&
  Number(value) > 0;

const isValidPrice = (value) =>
  value !== '' &&
  value !== null &&
  value !== undefined &&
  Number.isFinite(Number(value)) &&
  Number(value) >= 0;

/* ==========================================
 * GET: Semua detail pesanan
 * ========================================== */

const getAllTransactionDetails = async (req, res) => {
  try {
    const details =
      await transactionDetailModel.findAllTransactionDetails();

    return success(
      res,
      200,
      'Berhasil mengambil semua detail pesanan',
      details
    );
  } catch (error) {
    console.error('[getAllTransactionDetails]', error);
    return fail(res, 500, 'Server Error');
  }
};

/* ==========================================
 * GET: Detail berdasarkan ID
 * ========================================== */

const getTransactionDetailById = async (req, res) => {
  try {
    const detail =
      await transactionDetailModel.findTransactionDetailById(
        req.params.id
      );

    if (!detail) {
      return fail(res, 404, 'Detail pesanan tidak ditemukan');
    }

    return success(
      res,
      200,
      'Berhasil mengambil detail pesanan',
      detail
    );
  } catch (error) {
    console.error('[getTransactionDetailById]', error);
    return fail(res, 500, 'Server Error');
  }
};

/* ==========================================
 * GET: Detail berdasarkan ID transaksi
 * ========================================== */

const getDetailsByTransactionId = async (req, res) => {
  try {
    const { transactionId } = req.params;

    if (
      typeof transactionId !== 'string' ||
      !transactionId.trim()
    ) {
      return fail(res, 400, 'ID pesanan tidak valid');
    }

    const details =
      await transactionDetailModel.findDetailsByTransactionId(
        transactionId.trim()
      );

    return success(
      res,
      200,
      'Berhasil mengambil detail berdasarkan pesanan',
      details
    );
  } catch (error) {
    console.error('[getDetailsByTransactionId]', error);
    return fail(res, 500, 'Server Error');
  }
};

/* ==========================================
 * POST: Menambahkan produk ke pesanan
 * ========================================== */

const createTransactionDetail = async (req, res) => {
  try {
    const {
      transaction_id,
      product_id,
      quantity,
      price_at_time,
    } = req.body;

    if (
      typeof transaction_id !== 'string' ||
      !transaction_id.trim()
    ) {
      return fail(res, 400, 'ID pesanan wajib diisi');
    }

    if (!isPositiveInteger(product_id)) {
      return fail(res, 400, 'ID produk tidak valid');
    }

    if (!isPositiveInteger(quantity)) {
      return fail(
        res,
        400,
        'Jumlah produk harus berupa bilangan bulat lebih dari 0'
      );
    }

    if (!isValidPrice(price_at_time)) {
      return fail(res, 400, 'Harga produk tidak valid');
    }

    const normalizedQuantity = Number(quantity);
    const normalizedPrice = Number(price_at_time);
    const subtotal = normalizedQuantity * normalizedPrice;

    if (!Number.isFinite(subtotal)) {
      return fail(res, 400, 'Subtotal tidak valid');
    }

    const detail =
      await transactionDetailModel.createTransactionDetail({
        transaction_id: transaction_id.trim(),
        product_id: Number(product_id),
        quantity: normalizedQuantity,
        price_at_time: normalizedPrice,
        subtotal,
      });

    return success(
      res,
      201,
      'Detail pesanan berhasil ditambahkan',
      detail
    );
  } catch (error) {
    console.error('[createTransactionDetail]', error);

    if (
      error.message?.includes(
        'FOREIGN KEY constraint failed'
      )
    ) {
      return fail(
        res,
        400,
        'Pesanan atau produk tidak ditemukan'
      );
    }

    return fail(res, 500, 'Server Error');
  }
};

/* ==========================================
 * PUT: Memperbarui detail produk
 * ========================================== */

const updateTransactionDetail = async (req, res) => {
  try {
    const { quantity, price_at_time } = req.body;

    if (
      quantity === undefined &&
      price_at_time === undefined
    ) {
      return fail(
        res,
        400,
        'Jumlah atau harga wajib diisi'
      );
    }

    if (
      quantity !== undefined &&
      !isPositiveInteger(quantity)
    ) {
      return fail(
        res,
        400,
        'Jumlah produk harus berupa bilangan bulat lebih dari 0'
      );
    }

    if (
      price_at_time !== undefined &&
      !isValidPrice(price_at_time)
    ) {
      return fail(res, 400, 'Harga produk tidak valid');
    }

    const updateData = {};

    if (quantity !== undefined) {
      updateData.quantity = Number(quantity);
    }

    if (price_at_time !== undefined) {
      updateData.price_at_time = Number(price_at_time);
    }

    const detail =
      await transactionDetailModel.updateTransactionDetail(
        req.params.id,
        updateData
      );

    if (!detail) {
      return fail(res, 404, 'Detail pesanan tidak ditemukan');
    }

    return success(
      res,
      200,
      'Detail pesanan berhasil diperbarui',
      detail
    );
  } catch (error) {
    console.error('[updateTransactionDetail]', error);
    return fail(res, 500, 'Server Error');
  }
};

/* ==========================================
 * DELETE: Menghapus produk dari pesanan
 * ========================================== */

const deleteTransactionDetail = async (req, res) => {
  try {
    const deleted =
      await transactionDetailModel.deleteTransactionDetail(
        req.params.id
      );

    if (!deleted) {
      return fail(res, 404, 'Detail pesanan tidak ditemukan');
    }

    return success(
      res,
      200,
      'Detail produk berhasil dihapus dari pesanan'
    );
  } catch (error) {
    console.error('[deleteTransactionDetail]', error);
    return fail(res, 500, 'Server Error');
  }
};

/* ==========================================
 * EXPORT
 * ========================================== */

module.exports = {
  getAllTransactionDetails,
  getTransactionDetailById,
  getDetailsByTransactionId,
  createTransactionDetail,
  updateTransactionDetail,
  deleteTransactionDetail,
};
