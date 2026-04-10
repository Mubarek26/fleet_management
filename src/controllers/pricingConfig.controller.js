// pricingConfig.controller.js
const PricingConfig = require('../database/models/pricingConfig.model');
const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError');

// Get current pricing config
exports.getPricingConfig = catchAsync(async (req, res, next) => {
  const config = await PricingConfig.findOne();
  if (!config) return next(new appError('Pricing config not found', 404));
  res.status(200).json({ status: 'success', data: config });
});

// Update pricing config (admin only)
exports.updatePricingConfig = catchAsync(async (req, res, next) => {
  const update = req.body;
  update.updatedAt = new Date();
  const config = await PricingConfig.findOneAndUpdate({}, update, { new: true, upsert: true });
  res.status(200).json({ status: 'success', data: config });
});
