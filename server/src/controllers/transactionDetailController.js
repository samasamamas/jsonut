
const transactionDetailModel = require('../models/transactionDetailModel');

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

// GET semua detail pesanan
const getAllTransactionDetails = async (req, res) => {
  try {
    const details = await transactionDetailModel.findAllTransactionDetails();

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

// GET detail berdasarkan ID
const getTransactionDetailById = async (req, res) => {
  try {
    const detail = await transactionDetailModel.findTransactionDetailById(
      req.params.id
    );

    if (!detail) {
      return fail(res, 404, 'Detail pesanan tidak ditemukan');
    }

    return success(res, 200, 'Berhasil mengambil detail pesanan', detail);
  } catch (error) {
    console.error('[getTransactionDetailById]', error);
    return fail(res, 500, 'Server Error');
  }
};

// GET detail berdasarkan ID pesanan
const getDetailsByTransactionId = async (req, res) => {
  try {
    const details = await transactionDetailModel.findDetailsByTransactionId(
      req.params.transactionId
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

// POST menambahkan produk ke pesanan
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

    if (!Number.isInteger(product_id) || product_id <= 0) {
      return fail(res, 400, 'ID produk tidak valid');
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return fail(res, 400, 'Jumlah produk harus lebih dari 0');
    }

    if (
      !Number.isFinite(price_at_time) ||
      price_at_time < 0
    ) {
      return fail(res, 400, 'Harga produk tidak valid');
    }

    const subtotal = quantity * price_at_time;

    const detail = await transactionDetailModel.createTransactionDetail({
      transaction_id: transaction_id.trim(),
      product_id,
      quantity,
      price_at_time,
      subtotal,
    });

    return success(res, 201, 'Detail pesanan berhasil ditambahkan', detail);
  } catch (error) {
    console.error('[createTransactionDetail]', error);

    if (error.message?.includes('FOREIGN KEY constraint failed')) {
      return fail(res, 400, 'Pesanan atau produk tidak ditemukan');
    }

    return fail(res, 500, 'Server Error');
  }
};

// PUT memperbarui detail produk
const updateTransactionDetail = async (req, res) => {
  try {
    const { quantity, price_at_time } = req.body;

    if (
      quantity === undefined &&
      price_at_time === undefined
    ) {
      return fail(res, 400, 'Jumlah atau harga wajib diisi');
    }

    if (
      quantity !== undefined &&
      (!Number.isInteger(quantity) || quantity <= 0)
    ) {
      return fail(res, 400, 'Jumlah produk harus lebih dari 0');
    }

    if (
      price_at_time !== undefined &&
      (!Number.isFinite(price_at_time) || price_at_time < 0)
    ) {
      return fail(res, 400, 'Harga produk tidak valid');
    }

    const detail = await transactionDetailModel.updateTransactionDetail(
      req.params.id,
      { quantity, price_at_time }
    );

    if (!detail) {
      return fail(res, 404, 'Detail pesanan tidak ditemukan');
    }

    return success(res, 200, 'Detail pesanan berhasil diperbarui', detail);
  } catch (error) {
    console.error('[updateTransactionDetail]', error);
    return fail(res, 500, 'Server Error');
  }
};

// DELETE satu detail produk
const deleteTransactionDetail = async (req, res) => {
  try {
    const deleted = await transactionDetailModel.deleteTransactionDetail(
      req.params.id
    );

    if (!deleted) {
      return fail(res, 404, 'Detail pesanan tidak ditemukan');
    }

    return success(res, 200, 'Detail produk berhasil dihapus dari pesanan');
  } catch (error) {
    console.error('[deleteTransactionDetail]', error);
    return fail(res, 500, 'Server Error');
  }
};

module.exports = {
  getAllTransactionDetails,
  getTransactionDetailById,
  getDetailsByTransactionId,
  createTransactionDetail,
  updateTransactionDetail,
  deleteTransactionDetail,
};
