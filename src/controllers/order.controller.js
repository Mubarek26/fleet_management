const catchAsync = require('../utils/catchAsync');
const orderService = require('../services/order.service');

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
