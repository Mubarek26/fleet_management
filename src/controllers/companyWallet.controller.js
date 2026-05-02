const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const mongoose = require('mongoose');
const Driver = require('../database/models/driver.model');
const Trip = require('../database/models/trip.model');
const Transaction = require('../database/models/Transaction.model');
const Withdrawal = require('../database/models/withdrawal.model');

// GET /api/v1/company/drivers/wallets
exports.getDriversWallets = catchAsync(async (req, res, next) => {
  const user = req.user;
  let filter = {};
  if (user.role === 'COMPANY_ADMIN') {
    if (!user.companyId) return next(new AppError('No company associated with this user', 404));
    filter.companyId = user.companyId;
  }

  const drivers = await Driver.find(filter).select('fullName balance totalEarnings phoneNumber email').lean();

  // Normalize output for frontend: include driverId field (string)
  const normalized = drivers.map(d => ({
    driverId: String(d._id),
    fullName: d.fullName,
    phone: d.phoneNumber || null,
    email: d.email || null,
    balance: d.balance || 0,
    totalEarnings: d.totalEarnings || 0
  }));

  res.status(200).json({ status: 'success', results: normalized.length, data: normalized });
});

// GET /api/v1/company/drivers/:id/transactions
exports.getDriverTransactions = catchAsync(async (req, res, next) => {
  const driverId = req.params.id;
  if (!driverId || !mongoose.Types.ObjectId.isValid(driverId)) return next(new AppError('Invalid driver id', 400));

  // Resolve driver record to obtain the linked user id (Trip.driverId references User._id)
  const driver = await Driver.findById(driverId).select('userId companyId');
  if (!driver) return next(new AppError('Driver not found', 404));

  // If company admin, ensure they can view this driver's data
  if (req.user.role === 'COMPANY_ADMIN' && String(driver.companyId) !== String(req.user.companyId)) {
    return next(new AppError('Not allowed to view this driver', 403));
  }

  const userId = driver.userId; // this is the value stored on Trip.driverId
  if (!userId) return res.status(200).json({ status: 'success', data: [] });

  // Find trips for this driver (by userId) and collect driverWalletTransaction ids
  const trips = await Trip.find({ driverId: userId }).select('driverWalletTransaction');
  const txIds = trips.map(t => t.driverWalletTransaction).filter(Boolean);
  if (txIds.length === 0) return res.status(200).json({ status: 'success', data: [] });
  const transactions = await Transaction.find({ _id: { $in: txIds } }).sort({ createdAt: -1 });
  res.status(200).json({ status: 'success', data: transactions });
});

// POST /api/v1/company/drivers/:id/withdrawals
exports.createWithdrawal = catchAsync(async (req, res, next) => {
  const { amount, note } = req.body;
  if (!amount || amount <= 0) return next(new AppError('Invalid withdraw amount', 400));

  let driver;
  // If driver is creating the request, resolve their Driver record from userId
  if (req.user.role === 'DRIVER') {
    driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) return next(new AppError('Driver profile not found for this user', 404));
  } else {
    // For admins, driver id must be in params
    const driverId = req.params.id;
    if (!driverId || !mongoose.Types.ObjectId.isValid(driverId)) return next(new AppError('Invalid driver id', 400));
    driver = await Driver.findById(driverId);
    if (!driver) return next(new AppError('Driver not found', 404));
    // Ensure company admin can only create withdrawals for their drivers
    if (req.user.role === 'COMPANY_ADMIN' && String(driver.companyId) !== String(req.user.companyId)) {
      return next(new AppError('Not allowed to manage this driver', 403));
    }
  }

  // Ensure requested amount does not exceed driver's available balance
  const requestedAmount = Number(amount);
  if (isNaN(requestedAmount) || requestedAmount <= 0) return next(new AppError('Invalid withdraw amount', 400));
  if (driver.balance < requestedAmount) return next(new AppError('Withdrawal amount exceeds available balance', 400));

  const withdrawal = await Withdrawal.create({
    driverId: driver._id,
    companyId: driver.companyId,
    requestedBy: req.user._id,
    amount: requestedAmount,
    note: note || '',
    status: 'PENDING',
  });

  res.status(201).json({ status: 'success', data: withdrawal });
});

// PATCH /api/v1/company/withdrawals/:id/approve
exports.approveWithdrawal = catchAsync(async (req, res, next) => {
  const withdrawalId = req.params.id;
  const withdrawal = await Withdrawal.findById(withdrawalId);
  if (!withdrawal) return next(new AppError('Withdrawal not found', 404));
  if (withdrawal.status !== 'PENDING') return next(new AppError('Withdrawal already processed', 400));

  const driver = await Driver.findById(withdrawal.driverId);
  if (!driver) return next(new AppError('Driver not found', 404));

  // Decrement driver balance safely
  if (driver.balance < withdrawal.amount) {
    return next(new AppError('Insufficient driver balance', 400));
  }

  driver.balance = driver.balance - withdrawal.amount;
  await driver.save();

  withdrawal.status = 'APPROVED';
  withdrawal.processedBy = req.user._id;
  withdrawal.processedAt = new Date();
  await withdrawal.save();

  res.status(200).json({ status: 'success', data: withdrawal });
});

// GET /api/v1/company/withdrawals
exports.getWithdrawals = catchAsync(async (req, res, next) => {
  const user = req.user;
  let filter = {};
  if (user.role === 'COMPANY_ADMIN') {
    if (!user.companyId) return next(new AppError('No company associated with this user', 404));
    filter.companyId = user.companyId;
  }
  const withdrawals = await Withdrawal.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ status: 'success', results: withdrawals.length, data: withdrawals });
});

// GET /api/v1/driver/withdrawals - driver views their own withdrawal requests
exports.getDriverWithdrawals = catchAsync(async (req, res, next) => {
  let driver;
  if (req.user.role === 'DRIVER') {
    driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) return next(new AppError('Driver profile not found for this user', 404));
  } else {
    const driverId = req.params.id;
    if (!driverId || !mongoose.Types.ObjectId.isValid(driverId)) return next(new AppError('Invalid driver id', 400));
    driver = await Driver.findById(driverId);
    if (!driver) return next(new AppError('Driver not found', 404));
    if (req.user.role === 'COMPANY_ADMIN' && String(driver.companyId) !== String(req.user.companyId)) {
      return next(new AppError('Not allowed to view this driver', 403));
    }
  }

  const withdrawals = await Withdrawal.find({ driverId: driver._id }).sort({ createdAt: -1 });
  res.status(200).json({ status: 'success', results: withdrawals.length, data: withdrawals });
});
