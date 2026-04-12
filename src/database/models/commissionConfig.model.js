const mongoose = require('mongoose');

const commissionConfigSchema = new mongoose.Schema({
  commissionRate: {
    type: Number,
    default: 0.1, // 10%
    min: 0,
    max: 1
  },
  driverCommissionRate: {
    type: Number,
    default: 0.05, // 5%
    min: 0,
    max: 1
  }
}, { timestamps: true });

// Only one config document should exist
commissionConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

module.exports = mongoose.model('CommissionConfig', commissionConfigSchema);