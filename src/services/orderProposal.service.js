const mongoose = require('mongoose');
const Order = require('../database/models/order.model');
const OrderProposal = require('../database/models/orderProposal.model');
const Company = require('../database/models/company.model');
const AppError = require('../utils/appError');

const ALLOWED_PROPOSER_ROLES = ['COMPANY_ADMIN', 'PRIVATE_TRANSPORTER'];

const orderPopulate = [
	{
		path: 'createdBy',
		select: 'fullName email phoneNumber role status',
	},
	{
		path: 'targetCompanyId',
		select: 'companyName email phoneNumber status active',
	},
	{
		path: 'targetTransporterId',
		select: 'fullName email phoneNumber role status active companyId',
	},
];

const proposalPopulate = [
	{
		path: 'orderId',
		populate: orderPopulate,
	},
	{
		path: 'submittedByUserId',
		select: 'fullName email phoneNumber role status active companyId',
	},
	{
		path: 'companyId',
		select: 'companyName email phoneNumber status active ownerId',
	},
	{
		path: 'reviewedBy',
		select: 'fullName email phoneNumber role status',
	},
];

const populateOrderQuery = (query) => query.populate(orderPopulate);
const populateProposalQuery = (query) => query.populate(proposalPopulate);

const normalizeText = (value) => {
	if (value === undefined || value === null) return null;
	const normalized = String(value).trim();
	return normalized || null;
};

const normalizeNumber = (value, fieldName) => {
	if (value === undefined || value === null || value === '') return null;
	const parsed = Number(value);

	if (Number.isNaN(parsed)) {
		throw new AppError(`${fieldName} must be a valid number`, 400);
	}

	return parsed;
};

const normalizeDate = (value, fieldName) => {
	if (!value) return null;

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		throw new AppError(`${fieldName} must be a valid date`, 400);
	}

	return parsed;
};

const normalizeObjectId = (value, fieldName) => {
	const normalized = normalizeText(value);
	if (!normalized) {
		throw new AppError(`${fieldName} is required`, 400);
	}

	if (!mongoose.Types.ObjectId.isValid(normalized)) {
		throw new AppError(`${fieldName} must be a valid id`, 400);
	}

	return normalized;
};

const ensureAuthenticated = (user, message) => {
	if (!user?._id) {
		throw new AppError(message, 401);
	}
};

const ensureOrderOwnerOrSuperAdmin = (user, order) => {
	if (user.role === 'SUPER_ADMIN') return;

	if (String(order.createdBy) !== String(user._id)) {
		throw new AppError('Only the order creator can review proposals for this order', 403);
	}
};

const ensureOrderAcceptingProposals = (order) => {
	if (order.postStatus && order.postStatus !== 'ACTIVE') {
		throw new AppError('This order post is no longer accepting proposals', 400);
	}

	if (order.status !== 'OPEN') {
		throw new AppError('This order is no longer open for proposals', 400);
	}
};

const getActiveManagedCompany = async (user) => {
	let companyId = user.companyId;

	if (companyId) {
		const company = await Company.findById(companyId);
		if (!company || company.active === false || company.status !== 'ACTIVE') {
			throw new AppError('No active transporter company is linked to this account', 403);
		}

		return company;
	}

	const ownedCompany = await Company.findOne({ ownerId: user._id });
	if (!ownedCompany || ownedCompany.active === false || ownedCompany.status !== 'ACTIVE') {
		throw new AppError('No active transporter company is linked to this account', 403);
	}

	return ownedCompany;
};

const resolveProposerContext = async (user, order) => {
	if (!ALLOWED_PROPOSER_ROLES.includes(user.role)) {
		throw new AppError('Only company admins and private transporters can submit proposals', 403);
	}

	if (String(order.createdBy) === String(user._id)) {
		throw new AppError('You cannot submit a proposal for your own order', 403);
	}

	if (user.active === false || user.status !== 'ACTIVE') {
		throw new AppError('Your account must be active to submit proposals', 403);
	}

	if (user.role === 'COMPANY_ADMIN') {
		if (order.assignmentMode === 'DIRECT_PRIVATE_TRANSPORTER') {
			throw new AppError('This order is reserved for a private transporter', 403);
		}

		const company = await getActiveManagedCompany(user);
		if (
			order.assignmentMode === 'DIRECT_COMPANY' &&
			String(order.targetCompanyId) !== String(company._id)
		) {
			throw new AppError('This order is reserved for another transporter company', 403);
		}

		return {
			proposalType: 'COMPANY',
			company,
		};
	}

	if (order.assignmentMode === 'DIRECT_COMPANY') {
		throw new AppError('This order is reserved for a transporter company', 403);
	}

	if (
		order.assignmentMode === 'DIRECT_PRIVATE_TRANSPORTER' &&
		String(order.targetTransporterId) !== String(user._id)
	) {
		throw new AppError('This order is reserved for another private transporter', 403);
	}

	return {
		proposalType: 'PRIVATE_TRANSPORTER',
		company: null,
	};
};

const loadOrder = async (orderId) => {
	const normalizedOrderId = normalizeObjectId(orderId, 'orderId');
	const order = await Order.findById(normalizedOrderId);

	if (!order) {
		throw new AppError('No order found with that ID', 404);
	}

	return order;
};

const loadProposal = async (orderId, proposalId) => {
	const normalizedProposalId = normalizeObjectId(proposalId, 'proposalId');
	const proposal = await OrderProposal.findOne({
		_id: normalizedProposalId,
		orderId,
	});

	if (!proposal) {
		throw new AppError('No proposal found with that ID for this order', 404);
	}

	return proposal;
};

exports.submitProposal = async (user, orderId, payload = {}) => {
	ensureAuthenticated(user, 'You must be logged in to submit a proposal');

	const order = await loadOrder(orderId);
	ensureOrderAcceptingProposals(order);

	const proposer = await resolveProposerContext(user, order);

	const duplicateFilter = {
		orderId: order._id,
		proposalType: proposer.proposalType,
	};

	if (proposer.proposalType === 'COMPANY') {
		duplicateFilter.companyId = proposer.company._id;
	} else {
		duplicateFilter.submittedByUserId = user._id;
	}

	const existingProposal = await OrderProposal.findOne(duplicateFilter);
	if (existingProposal) {
		throw new AppError('A proposal has already been submitted for this order', 409);
	}

	const proposedPrice = normalizeNumber(
		payload.proposedPrice ?? payload.proposedBudget ?? payload.pricing?.proposedPrice,
		'proposedPrice'
	);
	const finalProposedPrice = proposedPrice ?? order.pricing?.proposedBudget;

	if (finalProposedPrice === null || finalProposedPrice === undefined) {
		throw new AppError('proposedPrice is required', 400);
	}

	if (
		order.pricing?.negotiable === false &&
		Number(finalProposedPrice) !== Number(order.pricing?.proposedBudget)
	) {
		throw new AppError('This order is fixed-price, so proposedPrice must match the order budget', 400);
	}

	const estimatedPickupDate = normalizeDate(payload.estimatedPickupDate, 'estimatedPickupDate');
	if (estimatedPickupDate && estimatedPickupDate < new Date()) {
		throw new AppError('estimatedPickupDate must be in the future', 400);
	}

	const proposal = await OrderProposal.create({
		orderId: order._id,
		submittedByUserId: user._id,
		companyId: proposer.company?._id || null,
		proposalType: proposer.proposalType,
		proposedPrice: finalProposedPrice,
		currency: normalizeText(payload.currency)?.toUpperCase() || order.pricing?.currency || 'ETB',
		message: normalizeText(payload.message),
		estimatedPickupDate,
		vehicleDetails: normalizeText(payload.vehicleDetails),
	});

	return populateProposalQuery(OrderProposal.findById(proposal._id));
};

exports.listOrderProposals = async (user, orderId) => {
	ensureAuthenticated(user, 'You must be logged in to view order proposals');

	const order = await loadOrder(orderId);
	const filter = { orderId: order._id };

	if (user.role !== 'SUPER_ADMIN' && String(order.createdBy) !== String(user._id)) {
		const proposer = await resolveProposerContext(user, order);

		if (proposer.proposalType === 'COMPANY') {
			filter.proposalType = 'COMPANY';
			filter.companyId = proposer.company._id;
		} else {
			filter.proposalType = 'PRIVATE_TRANSPORTER';
			filter.submittedByUserId = user._id;
		}
	}

	return populateProposalQuery(OrderProposal.find(filter).sort({ createdAt: -1 }));
};

exports.listMyProposals = async (user) => {
	ensureAuthenticated(user, 'You must be logged in to view your proposals');

	const filter = {};

	if (user.role === 'COMPANY_ADMIN') {
		const company = await getActiveManagedCompany(user);
		filter.proposalType = 'COMPANY';
		filter.companyId = company._id;
	} else if (user.role === 'PRIVATE_TRANSPORTER') {
		filter.proposalType = 'PRIVATE_TRANSPORTER';
		filter.submittedByUserId = user._id;
	} else if (user.role !== 'SUPER_ADMIN') {
		throw new AppError('Only company admins and private transporters can view submitted proposals', 403);
	}

	return populateProposalQuery(OrderProposal.find(filter).sort({ createdAt: -1 }));
};

exports.acceptProposal = async (user, orderId, proposalId) => {
	ensureAuthenticated(user, 'You must be logged in to accept a proposal');

	const order = await loadOrder(orderId);
	ensureOrderOwnerOrSuperAdmin(user, order);
	ensureOrderAcceptingProposals(order);

	const proposal = await loadProposal(order._id, proposalId);
	if (proposal.status !== 'PENDING') {
		throw new AppError(`This proposal is already ${proposal.status.toLowerCase()}`, 400);
	}

	const reviewedAt = new Date();

	proposal.status = 'ACCEPTED';
	proposal.reviewedBy = user._id;
	proposal.reviewedAt = reviewedAt;
	proposal.acceptedAt = reviewedAt;
	proposal.rejectionReason = null;
	await proposal.save();

	await OrderProposal.updateMany(
		{
			orderId: order._id,
			_id: { $ne: proposal._id },
			status: 'PENDING',
		},
		{
			$set: {
				status: 'REJECTED',
				reviewedBy: user._id,
				reviewedAt,
				rejectionReason: 'Another proposal was accepted',
			},
		}
	);

	order.status = 'ASSIGNED';
	order.assignmentMode = proposal.proposalType === 'COMPANY' ? 'DIRECT_COMPANY' : 'DIRECT_PRIVATE_TRANSPORTER';
	order.targetCompanyId = proposal.proposalType === 'COMPANY' ? proposal.companyId : null;
	order.targetTransporterId =
		proposal.proposalType === 'PRIVATE_TRANSPORTER' ? proposal.submittedByUserId : null;
	await order.save();

	const populatedOrder = await populateOrderQuery(Order.findById(order._id));
	const populatedProposal = await populateProposalQuery(OrderProposal.findById(proposal._id));

	return {
		order: populatedOrder,
		proposal: populatedProposal,
	};
};

exports.rejectProposal = async (user, orderId, proposalId, payload = {}) => {
	ensureAuthenticated(user, 'You must be logged in to reject a proposal');

	const order = await loadOrder(orderId);
	ensureOrderOwnerOrSuperAdmin(user, order);

	const proposal = await loadProposal(order._id, proposalId);
	if (proposal.status !== 'PENDING') {
		throw new AppError(`This proposal is already ${proposal.status.toLowerCase()}`, 400);
	}

	proposal.status = 'REJECTED';
	proposal.reviewedBy = user._id;
	proposal.reviewedAt = new Date();
	proposal.rejectionReason = normalizeText(payload.reason);
	proposal.acceptedAt = null;
	await proposal.save();

	return populateProposalQuery(OrderProposal.findById(proposal._id));
};
