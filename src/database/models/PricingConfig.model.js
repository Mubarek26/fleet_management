// PricingConfig.js
const mongoose = require('mongoose');

const pricingConfigSchema = new mongoose.Schema({
  baseFare: { type: Number, default: 50 },
  distanceRate: { type: Number, default: 10 },
  weightRate: { type: Number, default: 2 },
  serviceFee: { type: Number, default: 5 },
  taxRate: { type: Number, default: 0.15 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.PricingConfig || mongoose.model('PricingConfig', pricingConfigSchema);
