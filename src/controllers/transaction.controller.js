// transaction.controller.js
const Transaction = require('../database/models/Transaction.model');
const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError');


// Get transactions based on role
exports.getAllTransactions = catchAsync(async (req, res, next) => {
  let filter = {};

  // Role-based filtering
  if (req.user.role === 'COMPANY_ADMIN') {
    filter.companyId = req.user.companyId;
  } else if (req.user.role === 'SHIPPER') {
    filter.shipperId = req.user._id;
  } else if (req.user.role === 'SUPER_ADMIN') {
    // Allow optional company filter for Super Admin
    if (req.query.companyId) {
      filter.companyId = req.query.companyId;
    }
  } else {
    // Other roles might not have transactions, but we'll show empty or restricted
    // For now, let's allow VENDOR if they are assigned as companyId
    if (req.user.role === 'VENDOR') {
        filter.companyId = req.user.companyId;
    } else {
        // Restricted or no transactions for other roles
        // filter.shipperId = req.user._id; 
    }
  }

  const transactions = await Transaction.find(filter)
    .populate('companyId', 'companyName email')
    .populate('shipperId', 'fullName email')
    .sort({ createdAt: -1 });

  res.status(200).json({ 
    status: 'success', 
    results: transactions.length, 
    data: transactions 
  });
});

// Get a single transaction by tx_ref
exports.getTransactionByRef = catchAsync(async (req, res, next) => {
  const { tx_ref } = req.params;
  const transaction = await Transaction.findOne({ tx_ref });
  if (!transaction) return next(new appError('Transaction not found', 404));
  res.status(200).json({ status: 'success', data: transaction });
});
