
const Order = require('../database/models/order.model');
const Company = require('../database/models/company.model');
const User = require('../database/models/user.model');
const brokerService = require('./broker.service');
const AppError = require('../utils/appError');

const ALLOWED_CREATOR_ROLES = ['SHIPPER', 'VENDOR', 'BROKER', 'SUPER_ADMIN'];
const ALLOWED_MARKETPLACE_VIEWER_ROLES = ['COMPANY_ADMIN', 'PRIVATE_TRANSPORTER', 'SUPER_ADMIN'];

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

const normalizeDate = (value, fieldName, { required = false } = {}) => {
	if (!value) {
		if (required) {
			throw new AppError(`${fieldName} is required`, 400);
		}

		return null;
	}

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		throw new AppError(`${fieldName} must be a valid date`, 400);
	}

	return parsed;
};

const normalizeBoolean = (value, defaultValue = true) => {
	if (typeof value === 'boolean') return value;
	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		if (normalized === 'true') return true;
		if (normalized === 'false') return false;
	}

	return defaultValue;
};

const normalizeObjectId = (value, fieldName) => {
	const normalized = normalizeText(value);
	if (!normalized) return null;

	if (!Order.db.base.Types.ObjectId.isValid(normalized)) {
		throw new AppError(`${fieldName} must be a valid id`, 400);
	}

	return normalized;
};

const normalizeAssignmentMode = (value) => {
	const normalized = normalizeText(value)?.toUpperCase();
	if (!normalized) return 'OPEN_MARKETPLACE';

	const allowed = ['DIRECT_COMPANY', 'DIRECT_PRIVATE_TRANSPORTER', 'OPEN_MARKETPLACE'];
	if (!allowed.includes(normalized)) {
		throw new AppError(
			'assignmentMode must be one of DIRECT_COMPANY, DIRECT_PRIVATE_TRANSPORTER, or OPEN_MARKETPLACE',
			400
		);
	}

	return normalized;
};

const normalizeLocation = (location, fieldName, fallbackContact = {}) => {
	if (!location || typeof location !== 'object' || Array.isArray(location)) {
		throw new AppError(`${fieldName} is required and must be an object`, 400);
	}

	const address = normalizeText(location.address);
	if (!address) {
		throw new AppError(`${fieldName}.address is required`, 400);
	}

	const latitude = normalizeNumber(location.latitude, `${fieldName}.latitude`);
	const longitude = normalizeNumber(location.longitude, `${fieldName}.longitude`);

	return {
		address,
		city: normalizeText(location.city),
		state: normalizeText(location.state),
		country: normalizeText(location.country),
		latitude,
		longitude,
		contactName: normalizeText(location.contactName) || fallbackContact.contactName || null,
		contactPhone: normalizeText(location.contactPhone) || fallbackContact.contactPhone || null,
	};
};

exports.getCreatorOrders = async (user, query = {}) => {
	if (!user?._id) {
		throw new AppError('You must be logged in to view your created orders', 401);
	}

	const filter = {
		createdBy: user._id,
	};

	const status = normalizeText(query.status)?.toUpperCase();
	if (status) {
		filter.status = status;
	}

	const postStatus = normalizeText(query.postStatus)?.toUpperCase();
	if (postStatus) {
		filter.postStatus = postStatus;
	}

	const assignmentMode = normalizeText(query.assignmentMode)?.toUpperCase();
	if (assignmentMode) {
		filter.assignmentMode = assignmentMode;
	}

	const orders = await Order.find(filter)
		.populate(orderPopulate)
		.sort({ createdAt: -1 });

	return orders;
};

exports.getOpenMarketplaceOrders = async (user, query = {}) => {
	if (!user?._id) {
		throw new AppError('You must be logged in to view marketplace orders', 401);
	}

	if (!ALLOWED_MARKETPLACE_VIEWER_ROLES.includes(user.role)) {
		throw new AppError('Only transporter company admins and private transporters can view marketplace orders', 403);
	}

	const filter = {
		assignmentMode: 'OPEN_MARKETPLACE',
		channel: 'MARKETPLACE',
		status: 'OPEN',
		postStatus: 'ACTIVE',
	};

	const pickupCity = normalizeText(query.pickupCity);
	if (pickupCity) {
		filter['pickupLocation.city'] = new RegExp(`^${pickupCity}$`, 'i');
	}

	const deliveryCity = normalizeText(query.deliveryCity);
	if (deliveryCity) {
		filter['deliveryLocation.city'] = new RegExp(`^${deliveryCity}$`, 'i');
	}

	const vehicleType = normalizeText(query.vehicleType);
	if (vehicleType) {
		filter['vehicleRequirements.vehicleType'] = new RegExp(`^${vehicleType}$`, 'i');
	}

	const search = normalizeText(query.search);
	if (search) {
		filter.$or = [
			{ title: new RegExp(search, 'i') },
			{ description: new RegExp(search, 'i') },
			{ 'pickupLocation.address': new RegExp(search, 'i') },
			{ 'deliveryLocation.address': new RegExp(search, 'i') },
			{ 'cargo.type': new RegExp(search, 'i') },
		];
	}

	const orders = await Order.find(filter)
		.populate(orderPopulate)
		.sort({ createdAt: -1 });

	return orders;
};

exports.createMarketplaceOrder = async (user, payload = {}) => {
	if (!user?._id) {
		throw new AppError('You must be logged in to create a marketplace order', 401);
	}

	if (!ALLOWED_CREATOR_ROLES.includes(user.role)) {
		throw new AppError('Your account is not allowed to create marketplace orders', 403);
	}

	const title = normalizeText(payload.title);
	if (!title) {
		throw new AppError('title is required', 400);
	}

	const pickupDate = normalizeDate(payload.pickupDate, 'pickupDate', { required: true });
	const deliveryDeadline = normalizeDate(payload.deliveryDeadline, 'deliveryDeadline');

	if (deliveryDeadline && deliveryDeadline < pickupDate) {
		throw new AppError('deliveryDeadline must be greater than or equal to pickupDate', 400);
	}

	const pricingPayload = payload.pricing && typeof payload.pricing === 'object' ? payload.pricing : {};
	const proposedBudget = normalizeNumber(
		pricingPayload.proposedBudget ?? payload.proposedBudget,
		'pricing.proposedBudget'
	);

	if (proposedBudget === null) {
		throw new AppError('proposedBudget is required', 400);
	}

	const assignmentMode = normalizeAssignmentMode(payload.assignmentMode);
	const targetCompanyId = normalizeObjectId(payload.targetCompanyId, 'targetCompanyId');
	const targetTransporterId = normalizeObjectId(payload.targetTransporterId, 'targetTransporterId');

	let targetCompany = null;
	let targetTransporter = null;

	if (assignmentMode === 'DIRECT_COMPANY') {
		if (!targetCompanyId) {
			throw new AppError('targetCompanyId is required when assignmentMode is DIRECT_COMPANY', 400);
		}

		if (targetTransporterId) {
			throw new AppError('targetTransporterId is not allowed when assignmentMode is DIRECT_COMPANY', 400);
		}

		targetCompany = await Company.findById(targetCompanyId);
		if (!targetCompany || targetCompany.active === false || targetCompany.status !== 'ACTIVE') {
			throw new AppError('No active transporter company found with that targetCompanyId', 404);
		}
	}

	if (assignmentMode === 'DIRECT_PRIVATE_TRANSPORTER') {
		if (!targetTransporterId) {
			throw new AppError(
				'targetTransporterId is required when assignmentMode is DIRECT_PRIVATE_TRANSPORTER',
				400
			);
		}

		if (targetCompanyId) {
			throw new AppError(
				'targetCompanyId is not allowed when assignmentMode is DIRECT_PRIVATE_TRANSPORTER',
				400
			);
		}

		targetTransporter = await User.findById(targetTransporterId);
		if (
			!targetTransporter ||
			targetTransporter.active === false ||
			targetTransporter.status !== 'ACTIVE' ||
			targetTransporter.role !== 'PRIVATE_TRANSPORTER'
		) {
			throw new AppError('No active private transporter found with that targetTransporterId', 404);
		}
	}

	if (assignmentMode === 'OPEN_MARKETPLACE' && (targetCompanyId || targetTransporterId)) {
		throw new AppError(
			'targetCompanyId and targetTransporterId must not be provided when assignmentMode is OPEN_MARKETPLACE',
			400
		);
	}

	const fallbackContact = {
		contactName: normalizeText(user.fullName),
		contactPhone: normalizeText(user.phoneNumber),
	};

	const order = await Order.create({
		createdBy: user._id,
		assignmentMode,
		targetCompanyId: targetCompany?._id || null,
		targetTransporterId: targetTransporter?._id || null,
		channel: 'MARKETPLACE',
		status: 'PENDING',
		title,
		description: normalizeText(payload.description),
		pickupLocation: normalizeLocation(payload.pickupLocation, 'pickupLocation', fallbackContact),
		deliveryLocation: normalizeLocation(payload.deliveryLocation, 'deliveryLocation', fallbackContact),
		cargo: {
			type: normalizeText(payload.cargo?.type),
			description: normalizeText(payload.cargo?.description),
			weightKg: normalizeNumber(payload.cargo?.weightKg, 'cargo.weightKg'),
			quantity: normalizeNumber(payload.cargo?.quantity, 'cargo.quantity') || 1,
			unit: normalizeText(payload.cargo?.unit)?.toUpperCase() || 'ITEM',
			specialHandling: Array.isArray(payload.cargo?.specialHandling)
				? payload.cargo.specialHandling.map((item) => String(item).trim()).filter(Boolean)
				: [],
		},
		vehicleRequirements: {
			vehicleType: normalizeText(payload.vehicleRequirements?.vehicleType),
			minimumCapacityKg: normalizeNumber(
				payload.vehicleRequirements?.minimumCapacityKg,
				'vehicleRequirements.minimumCapacityKg'
			),
		},
		pickupDate,
		deliveryDeadline,
		pricing: {
			proposedBudget,
			currency: normalizeText(pricingPayload.currency ?? payload.currency)?.toUpperCase() || 'ETB',
			paymentMethod:
				normalizeText(pricingPayload.paymentMethod ?? payload.paymentMethod)?.toUpperCase() ||
				'BANK_TRANSFER',
			negotiable: normalizeBoolean(pricingPayload.negotiable ?? payload.negotiable, true),
		},
		specialInstructions: normalizeText(payload.specialInstructions),
	});

	try {
		const autoValidationResult = await brokerService.autoValidateOrderIfEligible(order._id, {
			autoTriggered: true,
			validationSource: 'ORDER_CREATE_RULES',
		});

		if (autoValidationResult?.order) {
			return autoValidationResult.order;
		}
	} catch (error) {
		// Keep order in PENDING when auto-validation cannot complete.
	}

	await order.populate(orderPopulate);

	return order;
};
