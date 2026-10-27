
const express = require('express');
const router = express.Router();

const transactionController = require('../controllers/transactionController');

// GET semua pesanan
router.get('/', transactionController.getAllTransactions);

// GET pesanan berdasarkan ID
router.get('/:id', transactionController.getTransactionById);

// POST membuat pesanan
router.post('/', transactionController.createTransaction);

// PUT memperbarui pesanan
router.put('/:id', transactionController.updateTransaction);

// DELETE menghapus pesanan
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
