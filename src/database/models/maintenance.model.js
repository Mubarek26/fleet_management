const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true },
  maintenanceType: { type: String, required: true },
  status: { type: String, enum: ['reported','scheduled','in_progress','completed','cancelled'], default: 'scheduled' },
  cost: { type: Number, default: 0 },
  technician: { type: String, default: null },
  notes: { type: String, default: '' },
  attachments: [{ url: String, public_id: String }],
  performedAt: { type: Date },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Maintenance', maintenanceSchema);
