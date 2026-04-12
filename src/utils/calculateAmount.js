// calculateAmount.js
// Calculates the total amount for a trip/order based on business rules from PricingConfig in DB
const PricingConfig = require('../database/models/PricingConfig.model');

async function calculateAmount({ distance = 0, weight = 0, discount = 0 }) {
  // Fetch config from DB (use defaults if not found)
  const config = await PricingConfig.findOne() || {};
  const baseFare = config.baseFare ?? 50;
  const distanceRate = config.distanceRate ?? 10;
  const weightRate = config.weightRate ?? 2;
  const serviceFee = config.serviceFee ?? 5;
  const taxRate = config.taxRate ?? 0.15;

  let amount = baseFare + (distance * distanceRate) + (weight * weightRate) + serviceFee;
  amount += amount * taxRate;
  amount -= discount;
  return Math.round(amount); // round to nearest integer
}

module.exports = calculateAmount;