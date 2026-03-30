const mongoose = require('mongoose');
const Order = require('../database/models/order.model');
const Company = require('../database/models/company.model');
const User = require('../database/models/user.model');
const Vehicle = require('../database/models/vehicle.model');
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
	{
		path: 'assignedVehicleId',
		select: 'plateNumber vehicleType model capacityKg status active companyId',
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

const parsePositiveInteger = (value, defaultValue) => {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed <= 0) return defaultValue;
	return parsed;
};

const normalizeVehicleType = (value) => {
	if (value === undefined || value === null) return null;
	const normalized = String(value).trim();
	return normalized || null;
};

const normalizeText = (value) => {
	if (value === undefined || value === null) return null;
	const normalized = String(value).trim();
	return normalized || null;
};

const normalizeObjectId = (value, fieldName) => {
	const normalized = normalizeText(value);
	if (!normalized) return null;

	if (!mongoose.Types.ObjectId.isValid(normalized)) {
		throw new AppError(`${fieldName} must be a valid id`, 400);
	}

	return normalized;
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

exports.matchOrder = async (user, orderId, query = {}) => {
	ensureAuthenticated(user);
	ensureValidOrderId(orderId);

	const order = await Order.findById(orderId)
		.populate({ path: 'createdBy', select: 'fullName email phoneNumber role status active' })
		.populate({ path: 'targetCompanyId', select: 'companyName email phoneNumber status active' })
		.populate({ path: 'targetTransporterId', select: 'fullName email phoneNumber role status active companyId isAvailable' });

	if (!order) {
		throw new AppError('No order found with that ID', 404);
	}

	if (order.postStatus !== 'ACTIVE') {
		throw new AppError('Only ACTIVE order posts can be matched', 400);
	}

	const limit = parsePositiveInteger(query.limit, 20);
	const minimumCapacityKg = Number(order.vehicleRequirements?.minimumCapacityKg || 0);
	const vehicleType = normalizeVehicleType(order.vehicleRequirements?.vehicleType);

	const companyCandidates = [];
	const privateTransporterCandidates = [];

	const includeCompanies = order.assignmentMode !== 'DIRECT_PRIVATE_TRANSPORTER';
	const includePrivateTransporters = order.assignmentMode !== 'DIRECT_COMPANY';

	if (includeCompanies) {
		const companyFilter = {
			active: true,
			status: 'ACTIVE',
		};

		if (order.assignmentMode === 'DIRECT_COMPANY' && order.targetCompanyId?._id) {
			companyFilter._id = order.targetCompanyId._id;
		}

		const companies = await Company.find(companyFilter)
			.select('companyName email phoneNumber status active numberOfCars')
			.limit(limit);

		for (const company of companies) {
			const vehicleFilter = {
				companyId: company._id,
				active: true,
				status: 'ACTIVE',
			};

			if (vehicleType) {
				vehicleFilter.vehicleType = new RegExp(`^${vehicleType}$`, 'i');
			}

			if (minimumCapacityKg > 0) {
				vehicleFilter.capacityKg = { $gte: minimumCapacityKg };
			}

			const matchedVehicles = await Vehicle.find(vehicleFilter)
				.select('plateNumber vehicleType model capacityKg')
				.limit(3);

			if (!matchedVehicles.length) {
				continue;
			}

			const adminUser = await User.findOne({
				companyId: company._id,
				role: 'COMPANY_ADMIN',
				active: true,
				status: 'ACTIVE',
			}).select('fullName email phoneNumber role status active companyId isAvailable');

			let score = 60;
			if (order.assignmentMode === 'DIRECT_COMPANY' && String(order.targetCompanyId?._id) === String(company._id)) {
				score += 30;
			}
			score += Math.min(matchedVehicles.length * 5, 15);
			score += Math.min(Number(company.numberOfCars || 0), 10);

			companyCandidates.push({
				matchType: 'COMPANY',
				score,
				reason: 'Company has active vehicles matching order requirements',
				company,
				contactUser: adminUser,
				matchedVehicles,
			});
		}
	}

	if (includePrivateTransporters) {
		const privateFilter = {
			role: 'PRIVATE_TRANSPORTER',
			active: true,
			status: 'ACTIVE',
		};

		if (order.assignmentMode === 'DIRECT_PRIVATE_TRANSPORTER' && order.targetTransporterId?._id) {
			privateFilter._id = order.targetTransporterId._id;
		}

		const privateTransporters = await User.find(privateFilter)
			.select('fullName email phoneNumber role status active companyId isAvailable')
			.limit(limit);

		for (const transporter of privateTransporters) {
			let score = 55;
			if (transporter.isAvailable) score += 15;
			if (
				order.assignmentMode === 'DIRECT_PRIVATE_TRANSPORTER' &&
				String(order.targetTransporterId?._id) === String(transporter._id)
			) {
				score += 30;
			}

			privateTransporterCandidates.push({
				matchType: 'PRIVATE_TRANSPORTER',
				score,
				reason: transporter.isAvailable
					? 'Private transporter is active and currently available'
					: 'Private transporter is active',
				transporter,
			});
		}
	}

	const candidates = [...companyCandidates, ...privateTransporterCandidates]
		.sort((a, b) => b.score - a.score)
		.slice(0, limit);

	return {
		order: {
			_id: order._id,
			orderNumber: order.orderNumber,
			title: order.title,
			status: order.status,
			assignmentMode: order.assignmentMode,
			vehicleRequirements: order.vehicleRequirements || {},
			pickupLocation: order.pickupLocation,
			deliveryLocation: order.deliveryLocation,
			pickupDate: order.pickupDate,
		},
		candidates,
	};
};

exports.assignOrder = async (user, payload = {}) => {
	ensureAuthenticated(user);

	const orderId = normalizeObjectId(payload.orderId, 'orderId');
	if (!orderId) {
		throw new AppError('orderId is required', 400);
	}

	const requestedMode = normalizeText(payload.assignmentMode)?.toUpperCase();
	const targetCompanyId = normalizeObjectId(payload.targetCompanyId, 'targetCompanyId');
	const targetTransporterId = normalizeObjectId(payload.targetTransporterId, 'targetTransporterId');

	if (targetCompanyId && targetTransporterId) {
		throw new AppError('Provide only one of targetCompanyId or targetTransporterId', 400);
	}

	if (!targetCompanyId && !targetTransporterId) {
		throw new AppError('One of targetCompanyId or targetTransporterId is required', 400);
	}

	const inferredMode = targetCompanyId ? 'DIRECT_COMPANY' : 'DIRECT_PRIVATE_TRANSPORTER';
	if (requestedMode && requestedMode !== inferredMode) {
		throw new AppError('assignmentMode does not match the selected target', 400);
	}

	const order = await Order.findById(orderId);
	if (!order) {
		throw new AppError('No order found with that ID', 404);
	}

	if (!['OPEN', 'MATCHED'].includes(order.status)) {
		throw new AppError('Only OPEN or MATCHED orders can be assigned', 400);
	}

	if (order.postStatus !== 'ACTIVE') {
		throw new AppError('Only ACTIVE order posts can be assigned', 400);
	}

	if (targetCompanyId) {
		const company = await Company.findById(targetCompanyId).select('status active');
		if (!company || company.active === false || company.status !== 'ACTIVE') {
			throw new AppError('targetCompanyId must reference an active transporter company', 404);
		}

		order.assignmentMode = 'DIRECT_COMPANY';
		order.targetCompanyId = company._id;
		order.targetTransporterId = null;
	} else {
		const transporter = await User.findById(targetTransporterId).select('role status active');
		if (
			!transporter ||
			transporter.active === false ||
			transporter.status !== 'ACTIVE' ||
			transporter.role !== 'PRIVATE_TRANSPORTER'
		) {
			throw new AppError('targetTransporterId must reference an active PRIVATE_TRANSPORTER account', 404);
		}

		order.assignmentMode = 'DIRECT_PRIVATE_TRANSPORTER';
		order.targetTransporterId = transporter._id;
		order.targetCompanyId = null;
	}

	order.status = 'ASSIGNED';
	await order.save();
	await order.populate(orderPopulate);

	return {
		order,
		assignment: {
			assignedAt: new Date().toISOString(),
			assignedBy: String(user._id),
			assignmentMode: order.assignmentMode,
			targetCompanyId: order.targetCompanyId?._id ? String(order.targetCompanyId._id) : null,
			targetTransporterId: order.targetTransporterId?._id ? String(order.targetTransporterId._id) : null,
		},
	};
};

exports.assignVehicle = async (user, orderId, payload = {}) => {
	ensureAuthenticated(user);
	ensureValidOrderId(orderId);

	const vehicleId = normalizeObjectId(payload.vehicleId, 'vehicleId');
	if (!vehicleId) {
		throw new AppError('vehicleId is required', 400);
	}

	const order = await Order.findById(orderId);
	if (!order) {
		throw new AppError('No order found with that ID', 404);
	}

	if (!['ASSIGNED'].includes(order.status)) {
		throw new AppError('Vehicle can only be assigned when order status is ASSIGNED', 400);
	}

	if (order.assignmentMode !== 'DIRECT_COMPANY' || !order.targetCompanyId) {
		throw new AppError('Vehicle assignment is only available for company-assigned orders', 400);
	}

	const vehicle = await Vehicle.findById(vehicleId).select('companyId vehicleType capacityKg status active');
	if (!vehicle) {
		throw new AppError('No vehicle found with that ID', 404);
	}

	if (vehicle.active === false || vehicle.status !== 'ACTIVE') {
		throw new AppError('Vehicle must be ACTIVE to be assigned', 400);
	}

	if (String(vehicle.companyId) !== String(order.targetCompanyId)) {
		throw new AppError('Selected vehicle does not belong to the assigned company', 400);
	}

	const requiredVehicleType = normalizeVehicleType(order.vehicleRequirements?.vehicleType);
	if (requiredVehicleType) {
		const vehicleTypeMatches = String(vehicle.vehicleType || '').trim().toUpperCase() === requiredVehicleType.toUpperCase();
		if (!vehicleTypeMatches) {
			throw new AppError('Selected vehicle does not match order vehicle type requirement', 400);
		}
	}

	const minimumCapacityKg = Number(order.vehicleRequirements?.minimumCapacityKg || 0);
	if (minimumCapacityKg > 0 && Number(vehicle.capacityKg || 0) < minimumCapacityKg) {
		throw new AppError('Selected vehicle does not meet minimum capacity requirement', 400);
	}

	order.assignedVehicleId = vehicle._id;
	await order.save();
	await order.populate(orderPopulate);

	return {
		order,
		assignment: {
			vehicleAssignedAt: new Date().toISOString(),
			vehicleAssignedBy: String(user._id),
			vehicleId: String(vehicle._id),
			companyId: String(order.targetCompanyId),
		},
	};
};
