// POST /api/driver/location
const catchAsync = require('../utils/catchAsync');
const driverService = require('../services/driver.service');

const locationService = require('../services/location.service');
const socket = require('../utils/socket');

exports.streamLocation = catchAsync(async (req, res, next) => {
	const { tripId, location, speed, heading } = req.body;
	// Validate input
	if (!tripId || !location || location.type !== 'Point' || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
		return next(new (require('../utils/appError'))('tripId and location (GeoJSON Point) are required', 400));
	}
	const [lng, lat] = location.coordinates.map(Number);
	if (isNaN(lng) || isNaN(lat)) {
		return next(new (require('../utils/appError'))('Coordinates must be numbers.', 400));
	}
	// Update location in DB and check trip ownership
	const trip = await locationService.updateDriverLocation({
		tripId,
		driverId: req.user._id,
		location: {
			type: 'Point',
			coordinates: [lng, lat],
			speed,
			heading
		}
	});
	// Emit real-time update via Socket.io
	socket.emitToTrip(tripId, {
		type: 'driver-location',
		tripId,
		driverId: req.user._id,
		location: {
			type: 'Point',
			coordinates: [lng, lat],
			speed,
			heading
		},
		geofenceStatus: trip.geofenceStatus,
		timestamp: Date.now()
	});
	res.status(200).json({
		status: 'success',
		message: 'Location updated',
		data: { 
			tripId, 
			location: { type: 'Point', coordinates: [lng, lat], speed, heading },
			geofenceStatus: trip.geofenceStatus
		}
	});
});




exports.acceptOrderAssignment = catchAsync(async (req, res) => {
	const order = await driverService.acceptOrderAssignment(req.user, req.params.orderId);
	res.status(200).json({
		status: 'success',
		message: 'Order assignment accepted',
		data: { order },
	});
});

exports.rejectOrderAssignment = catchAsync(async (req, res) => {
	const order = await driverService.rejectOrderAssignment(req.user, req.params.orderId);
	res.status(200).json({
		status: 'success',
		message: 'Order assignment rejected',
		data: { order },
	});
});

exports.startOrderAssignment = catchAsync(async (req, res) => {
	const order = await driverService.startOrderAssignment(req.user, req.params.orderId);
	res.status(200).json({
		status: 'success',
		message: 'Order started',
		data: { order },
	});
});

exports.arriveAtPickup = catchAsync(async (req, res) => {
	const order = await driverService.arriveAtPickup(req.user, req.params.orderId);
	res.status(200).json({
		status: 'success',
		message: 'Arrived at pickup location',
		data: { order },
	});
});

exports.completeOrderAssignment = catchAsync(async (req, res) => {
	const order = await driverService.completeOrderAssignment(req.user, req.params.orderId);
	res.status(200).json({
		status: 'success',
		message: 'Order completed',
		data: { order },
	});
});

exports.updateMyStatus = catchAsync(async (req, res) => {
	const driver = await driverService.updateMyStatus(req.user, req.body || {});

	res.status(200).json({
		status: 'success',
		message: 'Driver status updated successfully',
		data: {
			driver,
		},
	});
});

exports.getMyAssignments = catchAsync(async (req, res) => {
	const assignments = await driverService.getMyAssignments(req.user, req.query || {});

	res.status(200).json({
		status: 'success',
		results: assignments.length,
		data: {
			assignments,
		},
	});
});

exports.assignVehicleToDriver = catchAsync(async (req, res) => {
	const { driver, vehicle } = await driverService.assignVehicleToDriver(req.user, req.body || {});

	res.status(200).json({
		status: 'success',
		message: 'Driver assigned to vehicle successfully',
		data: {
			driver,
			vehicle,
		},
	});
});

exports.unassignVehicleFromDriver = catchAsync(async (req, res) => {
	const { driver, vehicle } = await driverService.unassignVehicleFromDriver(req.user, req.body || {});

	res.status(200).json({
		status: 'success',
		message: 'Driver unassigned from vehicle successfully',
		data: {
			driver,
			vehicle,
		},
	});
});

exports.reassignVehicleForDriver = catchAsync(async (req, res) => {
	const { driver, vehicle, previousVehicle } = await driverService.reassignVehicleForDriver(req.user, req.body || {});

	res.status(200).json({
		status: 'success',
		message: 'Driver reassigned to vehicle successfully',
		data: {
			driver,
			vehicle,
			previousVehicle,
		},
	});
});

exports.setPrivateTransporterFlag = catchAsync(async (req, res) => {
 	const driverId = req.params.driverId;
 	const { isPrivateTransporter } = req.body;

 	const driver = await driverService.setPrivateTransporterFlag(req.user, driverId, isPrivateTransporter);

 	res.status(200).json({
 		status: 'success',
 		message: `Driver updated successfully`,
 		data: { driver },
 	});
});

exports.setPrivateTransporterFlagByUser = catchAsync(async (req, res) => {
	const userId = req.params.userId;
	const { isPrivateTransporter } = req.body;

	const driver = await driverService.setPrivateTransporterFlagByUser(req.user, userId, isPrivateTransporter);

	res.status(200).json({
		status: 'success',
		message: `Driver updated successfully`,
		data: { driver },
	});
});

exports.assignDriverToCompany = catchAsync(async (req, res) => {
	const driverId = req.params.driverId;
	const { companyId } = req.body;

	const driver = await driverService.assignDriverToCompany(req.user, driverId, companyId);

	res.status(200).json({
		status: 'success',
		message: 'Driver assigned to company successfully',
		data: { driver },
	});
});

exports.assignDriverToCompanyByUser = catchAsync(async (req, res) => {
	const userId = req.params.userId;
	const { companyId } = req.body;

	const driver = await driverService.assignDriverToCompanyByUser(req.user, userId, companyId);

	res.status(200).json({
		status: 'success',
		message: 'Driver assigned to company successfully',
		data: { driver },
	});
});
