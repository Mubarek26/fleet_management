const Trip = require('../database/models/trip.model');
const catchAsync = require('../utils/catchAsync');

// GET /api/v1/driver/trips/history
exports.getMyTripHistory = catchAsync(async (req, res, next) => {
  const driverId = req.user._id;
  const trips = await Trip.find({ driverId }).sort({ createdAt: -1 });
  res.status(200).json({
    status: 'success',
    results: trips.length,
    data: trips
  });
});
