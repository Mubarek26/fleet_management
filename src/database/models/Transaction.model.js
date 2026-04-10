// Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  tx_ref: { type: String, required: true, unique: true },
  status: { type: String, required: true },
  amount: { type: Number, required: true },
  ref_id: { type: String },
  orderId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Helper to save transaction
transactionSchema.statics.saveTransactionToDatabase = async function (data) {
  const { tx_ref, status, amount, ref_id, orderId } = data;
  return this.findOneAndUpdate(
    { tx_ref },
    { status, amount, ref_id, orderId, updatedAt: new Date() },
    { upsert: true, new: true }
  );
};

module.exports = mongoose.model('Transaction', transactionSchema);
