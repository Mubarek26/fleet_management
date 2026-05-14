const mongoose = require('mongoose');

const Trip = require('../database/models/trip.model');
const Order = require('../database/models/order.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sendSMS } = require('../services/afromessage.service');

// GET /api/v1/trips/company
exports.getCompanyTrips = catchAsync(async (req, res, next) => {
  const targetCompanyId = req.user.companyId;

  if (!targetCompanyId) return next(new AppError('No companyId found on user', 400));

  const trips = await Trip.aggregate([
    {
      $lookup: {
        from: 'orders',
        localField: 'orderId',
        foreignField: '_id',
        as: 'orderId'
      }
    },
    { $unwind: '$orderId' },
    {
      $match: { 'orderId.targetCompanyId': new mongoose.Types.ObjectId(targetCompanyId) }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'driverId',
        foreignField: '_id',
        as: 'driverId'
      }
    },
    { $unwind: { path: '$driverId', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'vehicles',
        localField: 'vehicleId',
        foreignField: '_id',
        as: 'vehicleId'
      }
    },
    { $unwind: { path: '$vehicleId', preserveNullAndEmptyArrays: true } }
  ]);

  res.status(200).json({
    status: 'success',
    results: trips.length,
    data: { trips }
  });
});


// GET /api/trips/:id
exports.getTripById = catchAsync(async (req, res, next) => {
  const trip = await Trip.findById(req.params.id)
    .populate('driverId')
    .populate({
      path: 'orderId',
      populate: [
        { path: 'targetCompanyId' },
        { path: 'createdBy' }
      ]
    })
    .populate('vehicleId')
    .populate('geofences');
  if (!trip) return next(new AppError('Trip not found', 404));
  res.status(200).json({ status: 'success', data: { trip } });
});

// GET /api/trips
exports.getAllTrips = catchAsync(async (req, res, next) => {
  let filter = { active: true };

  const role = req.user.role;
  const userId = req.user._id;
  let companyId = req.user.companyId;

  // Resolve companyId for Company Admins if not directly on user object
  if (role === 'COMPANY_ADMIN' && !companyId) {
    const Company = require('../database/models/company.model');
    const company = await Company.findOne({ ownerId: userId });
    if (company) companyId = company._id;
  }

  if (role === 'COMPANY_ADMIN' || role === 'VENDOR') {
    // For companies/vendors, find trips where the associated order was targeted to them
    // or they created the order
    const Order = require('../database/models/order.model');
    const myOrders = await Order.find({
      $or: [
        { targetCompanyId: companyId },
        { targetTransporterId: userId },
        { createdBy: userId }
      ]
    }).select('_id');

    const orderIds = myOrders.map(o => o._id);
    filter.orderId = { $in: orderIds };
  } else if (role === 'DRIVER') {
    filter.driverId = userId;
  } else if (role === 'SHIPPER') {
    const Order = require('../database/models/order.model');
    const myOrders = await Order.find({ createdBy: userId }).select('_id');
    const orderIds = myOrders.map(o => o._id);
    filter.orderId = { $in: orderIds };
  } else if (role === 'SUPER_ADMIN') {
    // Super admin sees everything (no additional filter)
    delete filter.active; // Optional: maybe super admin sees inactive too
    filter.active = { $ne: false };

    // Allow SUPER_ADMIN to filter trips by company via query param `companyId`
    // Example: GET /api/v1/trips?companyId=<companyId>
    if (req.query.companyId) {
      const companyId = req.query.companyId;
      if (mongoose.Types.ObjectId.isValid(companyId)) {
        const Order = require('../database/models/order.model');
        const companyOrders = await Order.find({ targetCompanyId: companyId }).select('_id');
        const orderIds = companyOrders.map(o => o._id);
        filter.orderId = { $in: orderIds };
      }
    }
  }

  // Handle delayed filter
  if (req.query.delayed === 'true') {
    const Order = require('../database/models/order.model');
    const delayedOrders = await Order.find({
      deliveryDeadline: { $lt: new Date() },
      status: { $nin: ['DELIVERED', 'COMPLETED', 'CANCELLED'] }
    }).select('_id');

    const delayedOrderIds = delayedOrders.map(o => o._id);

    // Combine with existing orderId filter if present
    if (filter.orderId) {
      if (filter.orderId.$in) {
        filter.orderId.$in = filter.orderId.$in.filter(id =>
          delayedOrderIds.some(dId => dId.toString() === id.toString())
        );
      } else {
        filter.orderId = { $in: delayedOrderIds };
      }
    } else {
      filter.orderId = { $in: delayedOrderIds };
    }
  } else if (req.query.milestone) {
    filter.milestone = req.query.milestone.toUpperCase();
  }

  const trips = await Trip.find(filter)
    .populate('driverId')
    .populate({
      path: 'orderId',
      populate: [
        { path: 'targetCompanyId' },
        { path: 'createdBy' }
      ]
    })
    .populate('vehicleId')
    .populate('geofences')
    .sort({ createdAt: -1 });

  res.status(200).json({ status: 'success', results: trips.length, data: { trips } });
});

// POST /api/trips
exports.createTrip = catchAsync(async (req, res, next) => {
  let { location } = req.body;

  // ✅ Basic structure validation
  if (
    !location ||
    location.type !== 'Point' ||
    !Array.isArray(location.coordinates) ||
    location.coordinates.length !== 2
  ) {
    return next(
      new AppError(
        'Location must be GeoJSON: { type: "Point", coordinates: [lng, lat] }',
        400
      )
    );
  }

  // ✅ Ensure numbers
  let [lng, lat] = location.coordinates.map(Number);

  if (isNaN(lng) || isNaN(lat)) {
    return next(new AppError('Coordinates must be numbers.', 400));
  }

  // ✅ Validate ranges
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    return next(
      new AppError('Invalid longitude/latitude values.', 400)
    );
  }

  // ✅ Normalize clean GeoJSON
  const cleanLocation = {
    type: 'Point',
    coordinates: [lng, lat]
  };

  // ✅ Build safe payload (DO NOT trust req.body fully)
  const tripData = {
    ...req.body,
    location: cleanLocation,
    locationHistory: [cleanLocation]
  };

  const trip = await Trip.create(tripData);

  res.status(201).json({
    status: 'success',
    data: { trip }
  });
});

// PATCH /api/trips/:id
exports.updateTrip = catchAsync(async (req, res, next) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return next(new AppError('Trip not found', 404));
  // If location is being updated, also push to locationHistory
  if (req.body.location && req.body.location.type === 'Point' && Array.isArray(req.body.location.coordinates)) {
    trip.location = req.body.location;
    trip.locationHistory = trip.locationHistory || [];
    trip.locationHistory.push(req.body.location);
  }
  // Update other fields
  Object.keys(req.body).forEach(key => {
    if (key !== 'location' && key !== 'locationHistory') {
      trip[key] = req.body[key];
    }
  });
  await trip.save();
  res.status(200).json({ status: 'success', data: { trip } });
});

// DELETE /api/trips/:id
exports.deleteTrip = catchAsync(async (req, res, next) => {
  const trip = await Trip.findByIdAndUpdate(
    req.params.id,
    { active: false },
    { new: true, runValidators: true }
  );

  if (!trip) return next(new AppError('Trip not found', 404));

  res.status(200).json({
    status: 'success',
    data: trip
  });
});
// GET /api/trips/:id/track
exports.getTripTracking = catchAsync(async (req, res, next) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return next(new AppError('Trip not found', 404));
  res.status(200).json({
    status: 'success',
    data: {
      location: trip.location,
      locationHistory: trip.locationHistory,
      milestone: trip.milestone
    }
  });
});


// GET /api/v1/trips/lookup?q=<orderNumber|phone>
exports.lookupByQuery = catchAsync(async (req, res, next) => {
  const q = (req.query.q || '').trim();
  if (!q) return next(new AppError('Query parameter `q` is required', 400));

  let order = null;

  // Try exact orderNumber lookup first
  order = await Order.findOne({ orderNumber: q });

  // If not found, try matching delivery phone (exact match)
  if (!order) {
    order = await Order.findOne({ 'deliveryLocation.contactPhone': q });
  }

  // Fallback: digits-only phone match
  if (!order) {
    const digits = q.replace(/\D/g, '');
    if (digits) {
      order = await Order.findOne({ 'deliveryLocation.contactPhone': digits });
    }
  }

  if (!order) return next(new AppError('Order not found', 404));

  // Find the most recent trip for this order and populate related data
  const trip = await Trip.findOne({ orderId: order._id })
    .sort({ createdAt: -1 })
    .populate('driverId')
    .populate('vehicleId')
    .populate({
      path: 'orderId',
      populate: [
        { path: 'createdBy' },
        { path: 'targetCompanyId' }
      ]
    });

  if (!trip) {
    return res.status(200).json({
      status: 'success',
      message: 'Order found but no associated trip',
      data: { order }
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        deliveryLocation: order.deliveryLocation,
        status: order.status,
        createdBy: trip.orderId && trip.orderId.createdBy ? trip.orderId.createdBy : undefined
      },
      trip: {
        _id: trip._id,
        location: trip.location,
        locationHistory: trip.locationHistory,
        milestone: trip.milestone,
        createdAt: trip.createdAt,
        driver: trip.driverId || null,
        vehicle: trip.vehicleId || null,
        lastNote: trip.lastNote || null,
        milestoneHistory: trip.milestoneHistory || []
      }
    }
  });
});



// PATCH /api/driver/trips/:id/milestone
exports.updateMilestone = catchAsync(async (req, res, next) => {
  const { milestone, location, note, otpCode } = req.body;
  const trip = await Trip.findById(req.params.id);
  if (!trip) return next(new AppError('Trip not found', 404));
  if (trip.active === false) return next(new AppError('Trip is inactive/deleted', 400));

  // Optionally, validate allowed milestones
  const allowedMilestones = ['STARTED', 'ARRIVED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'];
  if (!milestone || !allowedMilestones.includes(milestone)) {
    return next(new AppError('Invalid or missing milestone', 400));
  }

  // OTP Logic for COMPLETED status
  if (milestone === 'COMPLETED') {
    if (!trip.deliveryOtp || !trip.deliveryOtp.code) {
      return next(new AppError('OTP was not generated. Please set status to DELIVERED first.', 400));
    }

    if (!otpCode) {
      return next(new AppError('OTP code is required to complete the trip', 400));
    }

    if (trip.deliveryOtp.code !== otpCode) {
      return next(new AppError('Invalid OTP code', 400));
    }

    if (new Date() > trip.deliveryOtp.expiresAt) {
      return next(new AppError('OTP code has expired. Please re-trigger DELIVERED status.', 400));
    }

    trip.deliveryOtp.verified = true;
  }

  trip.milestone = milestone;
  if (location && location.type === 'Point' && Array.isArray(location.coordinates)) {
    trip.location = location;
    trip.locationHistory = trip.locationHistory || [];
    trip.locationHistory.push(location);
  }
  if (note) trip.lastNote = note;
  trip.milestoneHistory = trip.milestoneHistory || [];
  trip.milestoneHistory.push({ milestone, location, note, at: new Date() });

  // Generate OTP when reaching DELIVERED status
  if (milestone === 'DELIVERED') {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    trip.deliveryOtp = {
      code: otp,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      verified: false
    };

    const order = await Order.findById(trip.orderId);
    if (order && order.deliveryLocation && order.deliveryLocation.contactPhone) {
      try {
        await sendSMS({
          to: order.deliveryLocation.contactPhone,
          message: `Your cargo delivery OTP is ${otp}. Please provide this to the driver to confirm completion of the trip for order ${order.orderNumber}.`
        });
      } catch (err) {
        console.error('Failed to send OTP SMS:', err);
      }
    }
  }

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
    message: `Trip milestone updated to ${milestone}`,
    data: { trip }
  });
});

exports.getDriverTrips = catchAsync(async (req, res, next) => {
  const driverId = req.user._id;

  const trips = await Trip.find({ driverId })
    .populate('orderId')
    .populate('vehicleId')
    .populate('geofences')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: trips.length,
    data: { trips }
  });
});
