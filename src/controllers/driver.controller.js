const catchAsync = require('../utils/catchAsync');
const driverService = require('../services/driver.service');

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
