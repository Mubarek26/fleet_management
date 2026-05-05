// transaction.routes.js
const express = require('express');
const authController = require('../controllers/auth.controller');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');

// Protect all routes
router.use(authController.protect);

// Get transactions (filtering handled in controller based on role)
const { requirePermissions } = require('../middleware/authorize.middleware');
router.get('/', requirePermissions('transactions:list'), transactionController.getAllTransactions);

// Get a transaction by tx_ref
router.get('/:tx_ref', requirePermissions('transactions:read'), transactionController.getTransactionByRef);

module.exports = router;
