const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true, index: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  note: { type: String, default: '' },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING', index: true },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  processedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
