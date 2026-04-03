const mongoose = require('mongoose');
const Driver = require('../database/models/driver.model');
const Vehicle = require('../database/models/vehicle.model');
const User = require('../database/models/user.model');
const Order = require('../database/models/order.model');
const AppError = require('../utils/appError');

const ALLOWED_DRIVER_STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED', 'OFFLINE'];
const DRIVER_STATUS_ROLES = ['DRIVER', 'SUPER_ADMIN', 'COMPANY_ADMIN'];
const DRIVER_ASSIGNMENT_ROLES = ['DRIVER', 'SUPER_ADMIN'];
const VEHICLE_ASSIGNMENT_ROLES = ['COMPANY_ADMIN', 'SUPER_ADMIN'];

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

const normalizeObjectId = (value, fieldName) => {
	if (!value) return null;
	const normalizedField = fieldName || 'id';
	if (!mongoose.isValidObjectId(value)) {
		throw new AppError(`${normalizedField} is not a valid ObjectId`, 400);
	}

	return new mongoose.Types.ObjectId(value);
};

const normalizeStatus = (value) => {
	if (value === undefined || value === null) return null;
	const normalized = String(value).trim().toUpperCase();
	return normalized || null;
};

const normalizeBoolean = (value) => {
	if (typeof value === 'boolean') return value;
	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		if (normalized === 'true') return true;
		if (normalized === 'false') return false;
	}

	return null;
};

const normalizeText = (value) => {
	if (value === undefined || value === null) return null;
	const normalized = String(value).trim();
	return normalized || null;
};

const assertLoggedIn = (user) => {
	if (!user?._id) {
		throw new AppError('You must be logged in to perform this action', 401);
	}
};

const assertRole = (user, roles, errorMessage) => {
	if (!roles.includes(user.role)) {
		throw new AppError(errorMessage, 403);
	}
};

const ensureCompanyAccess = (user, resourceCompanyId) => {
	if (!resourceCompanyId) return;
	if (user.role === 'COMPANY_ADMIN') {
		if (!user.companyId || String(user.companyId) !== String(resourceCompanyId)) {
			throw new AppError('You can only manage vehicles for your company', 403);
		}
	}
};

// --- DRIVER ORDER ACTIONS ---
const ORDER_STATUS = {
	ASSIGNED: 'ASSIGNED',
	ACCEPTED: 'ACCEPTED',
	REJECTED: 'REJECTED',
	IN_TRANSIT: 'IN_TRANSIT',
	ARRIVED: 'ARRIVED',
	DELIVERED: 'DELIVERED',
};

function assertDriverOwnsOrder(user, order) {
	if (!order.targetTransporterId || String(order.targetTransporterId) !== String(user._id)) {
		throw new AppError('You are not assigned to this order', 403);
	}
}

exports.acceptOrderAssignment = async (user, orderId) => {
	assertLoggedIn(user);
	const order = await Order.findById(orderId);
	if (!order) throw new AppError('Order not found', 404);
	assertDriverOwnsOrder(user, order);
	if (order.status !== ORDER_STATUS.ACCEPTED) {
		throw new AppError('Order is not in ACCEPTED state', 400);
	}
	order.status = ORDER_STATUS.ASSIGNED;
	await order.save();
	return order;
};

exports.rejectOrderAssignment = async (user, orderId) => {
	assertLoggedIn(user);
	const order = await Order.findById(orderId);
	if (!order) throw new AppError('Order not found', 404);
	assertDriverOwnsOrder(user, order);
	if (order.status !== ORDER_STATUS.ACCEPTED) {
		throw new AppError('Order is not in ACCEPTED state', 400);
	}
	order.status = ORDER_STATUS.REJECTED;
	await order.save();
	return order;
};

exports.startOrderAssignment = async (user, orderId) => {
	assertLoggedIn(user);
	const order = await Order.findById(orderId);
	if (!order) throw new AppError('Order not found', 404);
	assertDriverOwnsOrder(user, order);
	if (![ORDER_STATUS.ACCEPTED, ORDER_STATUS.ASSIGNED].includes(order.status)) {
		throw new AppError('Order must be accepted or assigned to start', 400);
	}
	order.status = ORDER_STATUS.IN_TRANSIT;
	await order.save();
	return order;
};

exports.arriveAtPickup = async (user, orderId) => {
	assertLoggedIn(user);
	const order = await Order.findById(orderId);
	if (!order) throw new AppError('Order not found', 404);
	assertDriverOwnsOrder(user, order);
	if (order.status !== ORDER_STATUS.IN_TRANSIT) {
		throw new AppError('Order must be IN_TRANSIT to arrive at pickup', 400);
	}
	order.status = ORDER_STATUS.ARRIVED;
	await order.save();
	return order;
};

exports.completeOrderAssignment = async (user, orderId) => {
	assertLoggedIn(user);
	const order = await Order.findById(orderId);
	if (!order) throw new AppError('Order not found', 404);
	assertDriverOwnsOrder(user, order);
	if (order.status !== ORDER_STATUS.ARRIVED) {
		throw new AppError('Order must be ARRIVED to complete', 400);
	}
	order.status = ORDER_STATUS.DELIVERED;
	await order.save();
	return order;
};

const ensureVehicleAssignable = (vehicle) => {
	if (!vehicle.active || vehicle.status !== 'ACTIVE') {
		throw new AppError('Vehicle must be active to be assigned', 400);
	}
};

const findDriverForUser = async (user) => {
	return Driver.findOne({
		$or: [{ userId: user._id }, { email: user.email }, { phoneNumber: user.phoneNumber }],
	});
};

const findDriverById = async (driverId) => Driver.findById(driverId);

exports.updateMyStatus = async (user, payload = {}) => {
	assertLoggedIn(user);
	assertRole(user, DRIVER_STATUS_ROLES, 'Only drivers can update driver status');

	const requestedStatus = normalizeStatus(payload.status);
	const requestedAvailability = normalizeBoolean(payload.isAvailable);

	if (!requestedStatus && requestedAvailability === null) {
		throw new AppError('Provide at least one of status or isAvailable', 400);
	}

	if (requestedStatus && !ALLOWED_DRIVER_STATUSES.includes(requestedStatus)) {
		throw new AppError('status must be one of PENDING, ACTIVE, SUSPENDED, or OFFLINE', 400);
	}

	const driver = await findDriverForUser(user);
	if (!driver) {
		throw new AppError('No driver profile found for this account', 404);
	}

	if (requestedStatus) {
		driver.status = requestedStatus;
	}

	if (requestedAvailability !== null) {
		await User.findByIdAndUpdate(user._id, { isAvailable: requestedAvailability });
	}

	await driver.save();

	return driver;
};

exports.getMyAssignments = async (user, query = {}) => {
	assertLoggedIn(user);
	assertRole(user, DRIVER_ASSIGNMENT_ROLES, 'Only drivers can view driver assignments');

	const filter = {
		targetTransporterId: user._id,
		status: { $in: ['ASSIGNED', 'IN_TRANSIT', 'DELIVERED'] },
	};

	const status = normalizeText(query.status)?.toUpperCase();
	if (status) {
		filter.status = status;
	}

	const assignments = await Order.find(filter)
		.populate(orderPopulate)
		.sort({ createdAt: -1 });

	return assignments;
};

exports.assignVehicleToDriver = async (user, payload = {}) => {
	assertLoggedIn(user);
	assertRole(user, VEHICLE_ASSIGNMENT_ROLES, 'Only company admins can assign drivers to vehicles');

	const driverId = normalizeObjectId(payload.driverId, 'driverId');
	const vehicleId = normalizeObjectId(payload.vehicleId, 'vehicleId');

	if (!driverId || !vehicleId) {
		throw new AppError('driverId and vehicleId are required', 400);
	}

	const driver = await findDriverById(driverId);
	if (!driver) {
		throw new AppError('No driver found with that ID', 404);
	}

	const vehicle = await Vehicle.findById(vehicleId);
	if (!vehicle) {
		throw new AppError('No vehicle found with that ID', 404);
	}

	if (String(driver.companyId) !== String(vehicle.companyId)) {
		throw new AppError('Driver and vehicle must belong to the same company', 400);
	}

	ensureCompanyAccess(user, driver.companyId);
	ensureVehicleAssignable(vehicle);

	if (driver.currentVehicleId && String(driver.currentVehicleId) !== String(vehicle._id)) {
		throw new AppError('Driver is already assigned to another vehicle. Use reassign endpoint.', 409);
	}

	if (vehicle.currentDriverId && String(vehicle.currentDriverId) !== String(driver._id)) {
		throw new AppError('Vehicle is already assigned to another driver', 409);
	}

	driver.currentVehicleId = vehicle._id;
	vehicle.currentDriverId = driver._id;

	await Promise.all([driver.save(), vehicle.save()]);

	return { driver, vehicle };
};

exports.unassignVehicleFromDriver = async (user, payload = {}) => {
	assertLoggedIn(user);
	assertRole(user, VEHICLE_ASSIGNMENT_ROLES, 'Only company admins can unassign drivers from vehicles');

	const driverId = normalizeObjectId(payload.driverId, 'driverId');
	if (!driverId) {
		throw new AppError('driverId is required', 400);
	}

	const driver = await findDriverById(driverId);
	if (!driver) {
		throw new AppError('No driver found with that ID', 404);
	}

	ensureCompanyAccess(user, driver.companyId);

	if (!driver.currentVehicleId) {
		throw new AppError('Driver is not currently assigned to a vehicle', 400);
	}

	const requestedVehicleId = normalizeObjectId(payload.vehicleId, 'vehicleId');
	if (requestedVehicleId && String(requestedVehicleId) !== String(driver.currentVehicleId)) {
		throw new AppError('Driver is not assigned to the requested vehicle', 400);
	}

	const vehicle = await Vehicle.findById(driver.currentVehicleId);

	if (vehicle) {
		vehicle.currentDriverId = null;
		await vehicle.save();
	}

	driver.currentVehicleId = null;
	await driver.save();

	return { driver, vehicle };
};

exports.reassignVehicleForDriver = async (user, payload = {}) => {
	assertLoggedIn(user);
	assertRole(user, VEHICLE_ASSIGNMENT_ROLES, 'Only company admins can reassign drivers to vehicles');

	const driverId = normalizeObjectId(payload.driverId, 'driverId');
	const vehicleId = normalizeObjectId(payload.vehicleId, 'vehicleId');

	if (!driverId || !vehicleId) {
		throw new AppError('driverId and vehicleId are required', 400);
	}

	const driver = await findDriverById(driverId);
	if (!driver) {
		throw new AppError('No driver found with that ID', 404);
	}

	const vehicle = await Vehicle.findById(vehicleId);
	if (!vehicle) {
		throw new AppError('No vehicle found with that ID', 404);
	}

	if (String(driver.companyId) !== String(vehicle.companyId)) {
		throw new AppError('Driver and vehicle must belong to the same company', 400);
	}

	ensureCompanyAccess(user, driver.companyId);
	ensureVehicleAssignable(vehicle);

	if (driver.currentVehicleId && String(driver.currentVehicleId) === String(vehicle._id)) {
		throw new AppError('Driver is already assigned to this vehicle', 400);
	}

	if (vehicle.currentDriverId && String(vehicle.currentDriverId) !== String(driver._id)) {
		throw new AppError('Vehicle is already assigned to another driver', 409);
	}

	const previousVehicleId = driver.currentVehicleId;
	let previousVehicle = null;

	if (previousVehicleId) {
		previousVehicle = await Vehicle.findById(previousVehicleId);
		if (previousVehicle && String(previousVehicle.currentDriverId) === String(driver._id)) {
			previousVehicle.currentDriverId = null;
		}
	}

	driver.currentVehicleId = vehicle._id;
	vehicle.currentDriverId = driver._id;

	const savePromises = [driver.save(), vehicle.save()];
	if (previousVehicle) {
		savePromises.push(previousVehicle.save());
	}
	await Promise.all(savePromises);

	return { driver, vehicle, previousVehicle };
};
