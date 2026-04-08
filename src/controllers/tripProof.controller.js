// tripProof.controller.js
const Trip = require('../database/models/trip.model');
const Order = require('../database/models/order.model');
const { sendSMS } = require('../services/afromessage.service');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const cloudinary = require('../config/cloudinary');
 const { handleProofOfDeliveryOtp } = require('../services/tripProof.service');
// POST /api/driver/trips/:id/evidence
exports.uploadProofOfDelivery = catchAsync(async (req, res, next) => {
  const tripId = req.params.id;
  const driverId = req.user._id;
  const trip = await Trip.findOne({ _id: tripId, driverId, active: true });
  if (!trip) return next(new AppError('Trip not found or not active', 404));

  let fileUrl = null;
  if (req.file) {
    // Upload to cloudinary
    const upload = await cloudinary.uploader.upload(req.file.path, { folder: 'proofs' });
    fileUrl = upload.secure_url;
  }

  const { type, note } = req.body;
  if (!type || !['photo', 'signature', 'note'].includes(type)) {
    return next(new AppError('Invalid or missing evidence type', 400));
  }

  const evidence = {
    type,
    url: fileUrl,
    note,
    at: new Date()
  };
  trip.proofOfDelivery.push(evidence);
  trip.milestone = 'DELIVERED';
  trip.milestoneHistory.push({ milestone: 'DELIVERED', note, at: new Date() });
  await trip.save();

  // Send OTP to recipient after proof upload
  try {
    await handleProofOfDeliveryOtp(trip);
  } catch (err) {
    // Log error but don't block response
    console.error('Failed to send OTP:', err.message);
  }

  res.status(200).json({ status: 'success', message: 'Proof of delivery uploaded, OTP sent to recipient', data: { trip } });
});

// POST /api/driver/trips/:id/verify-otp
exports.verifyDeliveryOtp = catchAsync(async (req, res, next) => {
  const tripId = req.params.id;
  const driverId = req.user._id;
  const { otp } = req.body;
  const trip = await Trip.findOne({ _id: tripId, driverId, active: true });
  if (!trip) return next(new AppError('Trip not found or not active', 404));
  if (!trip.deliveryOtp || !trip.deliveryOtp.code) {
    return next(new AppError('No OTP set for this trip', 400));
  }
  if (trip.deliveryOtp.verified) {
    return next(new AppError('OTP already verified', 400));
  }
  if (trip.deliveryOtp.expiresAt < new Date()) {
    return next(new AppError('OTP expired', 400));
  }
  if (trip.deliveryOtp.code !== otp) {
    return next(new AppError('Invalid OTP', 400));
  }
  trip.deliveryOtp.verified = true;
  trip.milestone = 'COMPLETED';
  trip.milestoneHistory.push({ milestone: 'COMPLETED', note: 'OTP verified', at: new Date() });
  await trip.save();
  res.status(200).json({ status: 'success', message: 'OTP verified, delivery completed', data: { trip } });
});

