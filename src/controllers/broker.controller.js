const catchAsync = require('../utils/catchAsync');
const brokerService = require('../services/broker.service');

exports.matchOrder = catchAsync(async (req, res) => {
	const result = await brokerService.matchOrder(req.user, req.params.orderId, req.query || {});

	res.status(200).json({
		status: 'success',
		results: result.candidates.length,
		data: result,
	});
});

exports.assignOrder = catchAsync(async (req, res) => {
	const result = await brokerService.assignOrder(req.user, req.body || {});

	res.status(200).json({
		status: 'success',
		message: 'Order assigned successfully',
		data: {
			order: result.order,
			assignment: result.assignment,
		},
	});
});

exports.assignVehicle = catchAsync(async (req, res) => {
	const result = await brokerService.assignVehicle(req.user, req.params.orderId, req.body || {});

	res.status(200).json({
		status: 'success',
		message: 'Vehicle assigned successfully',
		data: {
			order: result.order,
			assignment: result.assignment,
		},
	});
});

exports.validateOrder = catchAsync(async (req, res) => {
	const result = await brokerService.validateOrder(req.user, req.params.id, req.body || {});

	res.status(200).json({
		status: 'success',
		message: 'Order validated successfully',
		data: {
			order: result.order,
			validation: result.validation,
		},
	});
});
