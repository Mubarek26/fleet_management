const catchAsync = require('../utils/catchAsync');
const orderService = require('../services/order.service');

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
