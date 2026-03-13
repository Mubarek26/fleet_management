const mongoose = require('mongoose');
const Order = require('../database/models/order.model');
const Company = require('../database/models/company.model');
const User = require('../database/models/user.model');
const AppError = require('../utils/appError');

const orderPopulate = [
	{
		path: 'createdBy',
		select: 'fullName email phoneNumber role status active',
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

const normalizeBoolean = (value, defaultValue = false) => {
	if (typeof value === 'boolean') return value;
	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		if (normalized === 'true') return true;
		if (normalized === 'false') return false;
	}

	return defaultValue;
};

const ensureAuthenticated = (user) => {
	if (!user?._id) {
		throw new AppError('You must be logged in to validate orders', 401);
	}
};

const ensureValidOrderId = (orderId) => {
	if (!mongoose.Types.ObjectId.isValid(orderId)) {
		throw new AppError('Order id must be a valid id', 400);
	}
};

const buildValidationErrors = async (order) => {
	const errors = [];

	if (order.postStatus !== 'ACTIVE') {
		errors.push('Order postStatus must be ACTIVE');
	}

	if (order.status !== 'PENDING') {
		errors.push('Only orders in PENDING status can be validated');
	}

	if (!order.title || !order.title.trim()) {
		errors.push('title is required');
	}

	if (!order.pickupLocation?.address) {
		errors.push('pickupLocation.address is required');
	}

	if (!order.deliveryLocation?.address) {
		errors.push('deliveryLocation.address is required');
	}

	if (!order.pickupDate) {
		errors.push('pickupDate is required');
	}

	if (!order.pricing?.proposedBudget || Number(order.pricing.proposedBudget) <= 0) {
		errors.push('pricing.proposedBudget must be greater than 0');
	}

	if (order.deliveryDeadline && order.pickupDate && order.deliveryDeadline < order.pickupDate) {
		errors.push('deliveryDeadline must be greater than or equal to pickupDate');
	}

	if (order.assignmentMode === 'DIRECT_COMPANY') {
		if (!order.targetCompanyId) {
			errors.push('targetCompanyId is required when assignmentMode is DIRECT_COMPANY');
		} else {
			const company = await Company.findById(order.targetCompanyId).select('status active');
			if (!company || company.active === false || company.status !== 'ACTIVE') {
				errors.push('targetCompanyId must reference an active transporter company');
			}
		}
	}

	if (order.assignmentMode === 'DIRECT_PRIVATE_TRANSPORTER') {
		if (!order.targetTransporterId) {
			errors.push('targetTransporterId is required when assignmentMode is DIRECT_PRIVATE_TRANSPORTER');
		} else {
			const transporter = await User.findById(order.targetTransporterId).select('role status active');
			if (
				!transporter ||
				transporter.active === false ||
				transporter.status !== 'ACTIVE' ||
				transporter.role !== 'PRIVATE_TRANSPORTER'
			) {
				errors.push('targetTransporterId must reference an active PRIVATE_TRANSPORTER account');
			}
		}
	}

	if (order.assignmentMode === 'OPEN_MARKETPLACE') {
		if (order.targetCompanyId || order.targetTransporterId) {
			errors.push('targetCompanyId and targetTransporterId must be empty for OPEN_MARKETPLACE');
		}
	}

	return errors;
};

exports.validateOrder = async (user, orderId, payload = {}) => {
	ensureAuthenticated(user);
	ensureValidOrderId(orderId);

	const autoTriggered = normalizeBoolean(payload.autoTriggered, true);
	const validationSource = payload.validationSource ? String(payload.validationSource).trim() : null;

	const order = await Order.findById(orderId);
	if (!order) {
		throw new AppError('No order found with that ID', 404);
	}

	if (user.role !== 'SUPER_ADMIN' && String(order.createdBy) === String(user._id)) {
		throw new AppError('You cannot validate your own order', 403);
	}

	const validationErrors = await buildValidationErrors(order);
	if (validationErrors.length > 0) {
		throw new AppError(`Order failed validation: ${validationErrors.join('; ')}`, 400);
	}

	order.status = 'OPEN';
	await order.save();
	await order.populate(orderPopulate);

	return {
		order,
		validation: {
			autoTriggered,
			validatedAt: new Date().toISOString(),
			validatedBy: String(user._id),
			validationSource: validationSource || 'RULE_ENGINE',
		},
	};
};

exports.autoValidateOrderIfEligible = async (orderId, payload = {}) => {
	ensureValidOrderId(orderId);

	const autoTriggered = normalizeBoolean(payload.autoTriggered, true);
	const validationSource = payload.validationSource ? String(payload.validationSource).trim() : null;

	const order = await Order.findById(orderId);
	if (!order) {
		throw new AppError('No order found with that ID', 404);
	}

	const validationErrors = await buildValidationErrors(order);
	if (validationErrors.length > 0) {
		return {
			autoValidated: false,
			order,
			validation: {
				autoTriggered,
				validationSource: validationSource || 'RULE_ENGINE',
				errors: validationErrors,
			},
		};
	}

	order.status = 'OPEN';
	await order.save();
	await order.populate(orderPopulate);

	return {
		autoValidated: true,
		order,
		validation: {
			autoTriggered,
			validatedAt: new Date().toISOString(),
			validatedBy: 'SYSTEM',
			validationSource: validationSource || 'RULE_ENGINE',
		},
	};
};
