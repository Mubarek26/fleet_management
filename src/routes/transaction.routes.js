// transaction.routes.js
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');

// Get all transactions
router.get('/', transactionController.getAllTransactions);

// Get a transaction by tx_ref
router.get('/:tx_ref', transactionController.getTransactionByRef);

module.exports = router;
