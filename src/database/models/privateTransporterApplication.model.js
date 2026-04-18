const mongoose = require('mongoose');

const privateTransporterApplicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  vehicleType: { type: String, required: true },
  vehicleRegistrationNumber: { type: String, required: true },
  driversLicenseNumber: { type: String, required: true },
  licenseExpiryDate: { type: Date, required: true },
  nationalIdOrPassport: { type: String, required: true },
  uploads: {
    driversLicenseImage: { type: String },
    vehicleRegistrationImage: { type: String },
    profilePhoto: { type: String },
    nationalIdOrPassportImage: { type: String }
  },
  yearsOfExperience: { type: Number, required: true },
  availability: { type: String, enum: ['full-time', 'part-time'], required: true },
  notes: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  vehicleDetails: {
    plateNumber: { type: String },
    vehicleType: { type: String },
    model: { type: String },
    capacityKg: { type: Number }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PrivateTransporterApplication', privateTransporterApplicationSchema);
