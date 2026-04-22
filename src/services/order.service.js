// Assign driver and vehicle to order with validation

const Order = require('../database/models/order.model');
const Company = require('../database/models/company.model');
const User = require('../database/models/user.model');
const brokerService = require('./broker.service');
const AppError = require('../utils/appError');
const Vehicle = require('../database/models/vehicle.model');
const Trip = require('../database/models/trip.model');
const Geofence = require('../database/models/Geofence.model');

exports.assignOrder = async (orderId, driverId, vehicleId) => {
	if (!orderId || !driverId || !vehicleId) {
		throw new AppError('orderId, driverId, and vehicleId are required', 400);
	}
	const order = await Order.findById(orderId);
	if (!order) throw new AppError('Order not found', 404);
	if (order.status === 'ASSIGNED' && order.targetTransporterId && order.assignedVehicleId) {
		throw new AppError('Order is already assigned to a driver and vehicle', 400);
	}
	// Check driver exists and is active
	const driver = await User.findOne({ _id: driverId, active: true, status: 'ACTIVE' });
	if (!driver) throw new AppError('Driver not found or inactive', 404);
	// Check vehicle exists and is active
	const vehicle = await Vehicle.findOne({ _id: vehicleId, active: true, status: 'ACTIVE' });
	if (!vehicle) throw new AppError('Vehicle not found or inactive', 404);
	// Optionally, check vehicle is not already assigned to another order (except this one)
	const assignedOrder = await Order.findOne({ assignedVehicleId: vehicleId, status: 'ACCEPTED' });
	if (assignedOrder && String(assignedOrder._id) !== String(orderId)) {
		throw new AppError('Vehicle is already assigned to another order', 400);
	}
	order.targetTransporterId = driverId;
	order.assignedVehicleId = vehicleId;
	order.status = 'ASSIGNED';
	order.assignmentFailureReason = null;
	await order.save();

	// Debug log for pickup and delivery location
	// console.log('[assignOrder] pickupLocation:', order.pickupLocation);
	// console.log('[assignOrder] deliveryLocation:', order.deliveryLocation);

	// --- Geofence creation logic ---
	const geofenceIds = [];
	// Pickup geofence (Point)
	if (order.pickupLocation && order.pickupLocation.longitude != null && order.pickupLocation.latitude != null) {
		const pickupGeofence = await Geofence.create({
			name: 'Pickup Location',
			type: 'start',
			geometry: {
				type: 'Point',
				coordinates: [order.pickupLocation.longitude, order.pickupLocation.latitude]
			},
			radius: 100 // meters, adjust as needed
		});
		geofenceIds.push(pickupGeofence._id);
	}
	// Delivery geofence (Point)
	if (order.deliveryLocation && order.deliveryLocation.longitude != null && order.deliveryLocation.latitude != null) {
		const deliveryGeofence = await Geofence.create({
			name: 'Delivery Location',
			type: 'destination',
			geometry: {
				type: 'Point',
				coordinates: [order.deliveryLocation.longitude, order.deliveryLocation.latitude]
			},
			radius: 100 // meters, adjust as needed
		});
		geofenceIds.push(deliveryGeofence._id);
	}
	// Route corridor geofence (LineString)
	if (
		order.pickupLocation && order.pickupLocation.longitude != null && order.pickupLocation.latitude != null &&
		order.deliveryLocation && order.deliveryLocation.longitude != null && order.deliveryLocation.latitude != null
	) {
		const corridorGeofence = await Geofence.create({
			name: 'Route Corridor',
			type: 'corridor',
			geometry: {
				type: 'LineString',
				coordinates: [
					[order.pickupLocation.longitude, order.pickupLocation.latitude],
					[order.deliveryLocation.longitude, order.deliveryLocation.latitude]
				]
			},
			buffer: 0.2 // kilometers, adjust as needed
		});
		geofenceIds.push(corridorGeofence._id);
	}

	// --- Trip creation logic ---
	const existingTrip = await Trip.findOne({ orderId: order._id });
	if (!existingTrip) {
		await Trip.create({
			orderId: order._id,
			driverId,
			vehicleId,
			milestone: 'STARTED',
			milestoneHistory: [{ milestone: 'STARTED', at: new Date() }],
			geofences: geofenceIds
		});
	}

	return order;
};


const ALLOWED_CREATOR_ROLES = ['SHIPPER', 'VENDOR', 'BROKER', 'SUPER_ADMIN'];
const ALLOWED_MARKETPLACE_VIEWER_ROLES = ['COMPANY_ADMIN', 'PRIVATE_TRANSPORTER', 'SUPER_ADMIN'];

// --- COMPANY/SUPERADMIN ORDER ACCEPT/REJECT ---
exports.acceptOrderByCompany = async (user, orderId) => {
	if (!user || !user._id) throw new AppError('You must be logged in', 401);
	if (!['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
		throw new AppError('Not authorized', 403);
	}
	const order = await Order.findById(orderId);
	if (!order) throw new AppError('Order not found', 404);
	if (order.assignmentMode !== 'DIRECT_COMPANY') {
		throw new AppError('Order is not DIRECT_COMPANY type', 400);
	}
	if (user.role === 'COMPANY_ADMIN' && String(order.targetCompanyId) !== String(user.companyId)) {
		throw new AppError('Order not assigned to your company', 403);
	}
	if (order.status !== 'PENDING') {
		throw new AppError('Order is not pending', 400);
	}
	order.status = 'ACCEPTED';
	await order.save();
	return order;
};

exports.rejectOrderByCompany = async (user, orderId) => {
	if (!user || !user._id) throw new AppError('You must be logged in', 401);
	if (!['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
		throw new AppError('Not authorized', 403);
	}
	const order = await Order.findById(orderId);
	if (!order) throw new AppError('Order not found', 404);
	if (order.assignmentMode !== 'DIRECT_COMPANY') {
		throw new AppError('Order is not DIRECT_COMPANY type', 400);
	}
	if (user.role === 'COMPANY_ADMIN' && String(order.targetCompanyId) !== String(user.companyId)) {
		throw new AppError('Order not assigned to your company', 403);
	}
	if (order.status !== 'PENDING') {
		throw new AppError('Order is not pending', 400);
	}
	order.status = 'REJECTED';
	await order.save();
	return order;
};

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

// Utility to include assignmentFailureReason in order responses if needed
function orderToResponse(order) {
	if (!order) return order;
	if (typeof order.toObject === 'function') order = order.toObject();
	return {
		...order,
		assignmentFailureReason: order.assignmentFailureReason || null,
	};
}

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
		if (!targetCompany || targetCompany.active === false || targetCompany.status !== 'APPROVED') {
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


	// Debug log for assignmentMode and status
	console.log('[OrderCreate] assignmentMode:', assignmentMode);
	const status =
		assignmentMode === 'OPEN_MARKETPLACE'
			? 'OPEN'
			: 'PENDING';
	console.log('[OrderCreate] status to be set:', status);

	const order = await Order.create({
		createdBy: user._id,
		assignmentMode,
		targetCompanyId: targetCompany?._id || null,
		targetTransporterId: targetTransporter?._id || null,
		channel: 'MARKETPLACE',
		status,
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
	console.log('[OrderCreate] created order status:', order.status, 'assignmentMode:', order.assignmentMode, 'orderNumber:', order.orderNumber);

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
