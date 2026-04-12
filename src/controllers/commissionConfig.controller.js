const CommissionConfig = require('../database/models/commissionConfig.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// GET /api/config/commission
exports.getCommissionConfig = catchAsync(async (req, res, next) => {
  const config = await CommissionConfig.getConfig();
  res.status(200).json({ status: 'success', data: config });
});

// PATCH /api/config/commission
exports.updateCommissionConfig = catchAsync(async (req, res, next) => {
  const { commissionRate, driverCommissionRate } = req.body;
  const config = await CommissionConfig.getConfig();
  if (commissionRate !== undefined) config.commissionRate = commissionRate;
  if (driverCommissionRate !== undefined) config.driverCommissionRate = driverCommissionRate;
  await config.save();
  res.status(200).json({ status: 'success', data: config });
});
