// transaction.controller.js
const Transaction = require('../database/models/Transaction.model');
const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError');


// Get all transactions
exports.getAllTransactions = catchAsync(async (req, res, next) => {
  const transactions = await Transaction.find().sort({ createdAt: -1 });
  res.status(200).json({ status: 'success', results: transactions.length, data: transactions });
});

// Get a single transaction by tx_ref
exports.getTransactionByRef = catchAsync(async (req, res, next) => {
  const { tx_ref } = req.params;
  const transaction = await Transaction.findOne({ tx_ref });
  if (!transaction) return next(new appError('Transaction not found', 404));
  res.status(200).json({ status: 'success', data: transaction });
});
