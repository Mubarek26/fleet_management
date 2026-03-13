const Driver = require('../database/models/driver.model');
const User = require('../database/models/user.model');
const Order = require('../database/models/order.model');
const AppError = require('../utils/appError');

const ALLOWED_DRIVER_STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED', 'OFFLINE'];

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

exports.updateMyStatus = async (user, payload = {}) => {
	if (!user?._id) {
		throw new AppError('You must be logged in to update driver status', 401);
	}

	if (user.role !== 'DRIVER' && user.role !== 'SUPER_ADMIN' && user.role !== 'COMPANY_ADMIN') {
		throw new AppError('Only drivers can update driver status', 403);
	}

	const requestedStatus = normalizeStatus(payload.status);
	const requestedAvailability = normalizeBoolean(payload.isAvailable);

	if (!requestedStatus && requestedAvailability === null) {
		throw new AppError('Provide at least one of status or isAvailable', 400);
	}

	if (requestedStatus && !ALLOWED_DRIVER_STATUSES.includes(requestedStatus)) {
		throw new AppError('status must be one of PENDING, ACTIVE, or SUSPENDED', 400);
	}

	const driver = await Driver.findOne({
		$or: [{ userId: user._id }, { email: user.email }, { phoneNumber: user.phoneNumber }],
	});

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
	if (!user?._id) {
		throw new AppError('You must be logged in to view assignments', 401);
	}

	if (user.role !== 'DRIVER' && user.role !== 'SUPER_ADMIN') {
		throw new AppError('Only drivers can view driver assignments', 403);
	}

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
