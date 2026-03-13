const catchAsync = require('../utils/catchAsync');
const orderProposalService = require('../services/orderProposal.service');

exports.submitProposal = catchAsync(async (req, res) => {
	const proposal = await orderProposalService.submitProposal(req.user, req.params.orderId, req.body);

	res.status(201).json({
		status: 'success',
		message: 'Proposal submitted successfully',
		data: {
			proposal,
		},
	});
});

exports.listOrderProposals = catchAsync(async (req, res) => {
	const proposals = await orderProposalService.listOrderProposals(req.user, req.params.orderId);

	res.status(200).json({
		status: 'success',
		results: proposals.length,
		data: {
			proposals,
		},
	});
});

exports.listMyProposals = catchAsync(async (req, res) => {
	const proposals = await orderProposalService.listMyProposals(req.user);

	res.status(200).json({
		status: 'success',
		results: proposals.length,
		data: {
			proposals,
		},
	});
});

exports.acceptProposal = catchAsync(async (req, res) => {
	const result = await orderProposalService.acceptProposal(req.user, req.params.orderId, req.params.proposalId);

	res.status(200).json({
		status: 'success',
		message: 'Proposal accepted successfully',
		data: result,
	});
});

exports.rejectProposal = catchAsync(async (req, res) => {
	const proposal = await orderProposalService.rejectProposal(
		req.user,
		req.params.orderId,
		req.params.proposalId,
		req.body
	);

	res.status(200).json({
		status: 'success',
		message: 'Proposal rejected successfully',
		data: {
			proposal,
		},
	});
});
