const Trip = require('../database/models/trip.model');
const Order = require('../database/models/order.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// PATCH /api/driver/trips/:id/milestone
exports.updateMilestone = catchAsync(async (req, res, next) => {
  const { milestone, location, note } = req.body;
  const trip = await Trip.findById(req.params.id);
  if (!trip) return next(new AppError('Trip not found', 404));

  // Optionally, validate allowed milestones
  const allowedMilestones = ['STARTED', 'ARRIVED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'];
  if (!milestone || !allowedMilestones.includes(milestone)) {
    return next(new AppError('Invalid or missing milestone', 400));
  }

  trip.milestone = milestone;
  if (location) trip.lastLocation = location;
  if (note) trip.lastNote = note;
  trip.milestoneHistory = trip.milestoneHistory || [];
  trip.milestoneHistory.push({ milestone, location, note, at: new Date() });
  await trip.save();

  // Optionally, update order status if linked
  if (trip.orderId) {
    const order = await Order.findById(trip.orderId);
    if (order) {
      order.status = milestone;
      await order.save();
    }
  }

  res.status(200).json({
    status: 'success',
    message: 'Trip milestone updated',
    data: { trip }
  });
});
