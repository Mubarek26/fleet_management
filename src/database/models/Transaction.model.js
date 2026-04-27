// Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  trx_ref: { type: String, required: true, unique: true },
  status: { type: String, required: true },
  amount: { type: Number, required: true },
  ref_id: { type: String },
  orderId: { type: String },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  shipperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  commission: { type: Number, default: 0 },
  companyShare: { type: Number, default: 0 },
  driverCommission: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});


// Helper to save transaction
transactionSchema.statics.saveTransactionToDatabase = async function (data) {
  const { trx_ref, status, amount, ref_id, orderId, companyId, shipperId, commission = 0, driverCommission = 0 } = data;
  // Calculate company share
  const companyShare = amount - commission;
  return this.findOneAndUpdate(
    { trx_ref },
    { status, amount, ref_id, orderId, companyId, shipperId, commission, companyShare, driverCommission, updatedAt: new Date() },
    { upsert: true, new: true }
  );
};

module.exports = mongoose.model('Transaction', transactionSchema);
