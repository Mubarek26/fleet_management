const mongoose = require('mongoose');

const vendorApplicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyName: { type: String, required: true },
  contactName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  businessType: { type: String, required: true },
  businessRegistrationNumber: { type: String, required: true },
  taxIdNumber: { type: String, required: true },
  yearsInBusiness: { type: Number, required: true },
  website: { type: String },
  expectedMonthlyOrders: { type: Number, required: true },
  notes: { type: String },
  uploads: {
    businessLicenseImage: { type: String },
    taxIdImage: { type: String },
    companyProfileImage: { type: String }
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VendorApplication', vendorApplicationSchema);
