


const catchAsync = require('../utils/catchAsync');
const orderService = require('../services/order.service');

// Assign driver and vehicle to order
exports.assignOrder = catchAsync(async (req, res, next) => {
	const { driverId, vehicleId } = req.body;
	const { orderId } = req.params;
	const order = await orderService.assignOrder(orderId, driverId, vehicleId);
	res.status(200).json({
		status: 'success',
		message: 'Order assigned successfully',
		data: { order },
	});
});

// Company/Superadmin accept/reject order
exports.acceptOrderByCompany = catchAsync(async (req, res) => {
	const order = await orderService.acceptOrderByCompany(req.user, req.params.orderId);
	res.status(200).json({
		status: 'success',
		message: 'Order accepted by company',
		data: { order },
	});
});

exports.rejectOrderByCompany = catchAsync(async (req, res) => {
	const order = await orderService.rejectOrderByCompany(req.user, req.params.orderId);
	res.status(200).json({
		status: 'success',
		message: 'Order rejected by company',
		data: { order },
	});
});


exports.getMyCreatedOrders = catchAsync(async (req, res) => {
	const orders = await orderService.getCreatorOrders(req.user, req.query);

	res.status(200).json({
		status: 'success',
		results: orders.length,
		data: {
			orders,
		},
	});
});

exports.getOpenMarketplaceOrders = catchAsync(async (req, res) => {
	const orders = await orderService.getOpenMarketplaceOrders(req.user, req.query);

	res.status(200).json({
		status: 'success',
		results: orders.length,
		data: {
			orders,
		},
	});
});

exports.createMarketplaceOrder = catchAsync(async (req, res) => {
	const order = await orderService.createMarketplaceOrder(req.user, req.body);

	res.status(201).json({
		status: 'success',
		message: 'Marketplace order created successfully',
		data: {
			order,
		},
	});
});

exports.getOrder = catchAsync(async (req, res) => {
	const order = await orderService.getOrder(req.params.orderId);
	res.status(200).json({
		status: 'success',
		data: { order },
	});
});
