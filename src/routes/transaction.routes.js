// transaction.routes.js
const express = require('express');
const authController = require('../controllers/auth.controller');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');

// Protect all routes
router.use(authController.protect);

// Get transactions (filtering handled in controller based on role)
router.get('/', transactionController.getAllTransactions);

// Get a transaction by tx_ref
router.get('/:tx_ref', transactionController.getTransactionByRef);

module.exports = router;
