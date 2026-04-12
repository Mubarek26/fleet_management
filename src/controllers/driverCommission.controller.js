const Transaction = require('../database/models/Transaction.model');
const Trip = require('../database/models/trip.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// GET /api/v1/driver/commission
exports.getMyCommissionSummary = catchAsync(async (req, res, next) => {
  const driverId = req.user._id;
  // Find all trips for this driver
  const trips = await Trip.find({ driverId }).select('_id driverWalletTransaction');
  const transactionIds = trips.map(t => t.driverWalletTransaction).filter(Boolean);
  if (transactionIds.length === 0) {
    return res.status(200).json({ status: 'success', data: { totalCommission: 0, transactions: [] } });
  }
  // Get all transactions for these trips
  const transactions = await Transaction.find({ _id: { $in: transactionIds } });
  const totalCommission = transactions.reduce((sum, tx) => sum + (tx.driverCommission || 0), 0);
  res.status(200).json({
    status: 'success',
    data: {
      totalCommission,
      transactions
    }
  });
});

// GET /api/v1/driver/commission/history
exports.getMyCommissionHistory = catchAsync(async (req, res, next) => {
  const driverId = req.user._id;
  const trips = await Trip.find({ driverId }).select('_id driverWalletTransaction');
  const transactionIds = trips.map(t => t.driverWalletTransaction).filter(Boolean);
  if (transactionIds.length === 0) {
    return res.status(200).json({ status: 'success', data: [] });
  }
  const transactions = await Transaction.find({ _id: { $in: transactionIds } }).sort({ createdAt: -1 });
  res.status(200).json({
    status: 'success',
    data: transactions
  });
});
