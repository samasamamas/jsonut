
const express = require('express');
const router = express.Router();

const transactionDetailController = require('../controllers/transactionDetailController');

// GET semua detail pesanan
router.get('/', transactionDetailController.getAllTransactionDetails);

// GET detail berdasarkan ID pesanan
router.get(
  '/transaction/:transactionId',
  transactionDetailController.getDetailsByTransactionId
);

// GET satu detail berdasarkan ID
router.get(
  '/:id',
  transactionDetailController.getTransactionDetailById
);

// POST menambahkan produk ke pesanan
router.post(
  '/',
  transactionDetailController.createTransactionDetail
);

// PUT memperbarui detail produk
router.put(
  '/:id',
  transactionDetailController.updateTransactionDetail
);

// DELETE satu produk dari pesanan
router.delete(
  '/:id',
  transactionDetailController.deleteTransactionDetail
);

module.exports = router;
