const catchAsync = require('../utils/catchAsync');
const brokerService = require('../services/broker.service');

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
