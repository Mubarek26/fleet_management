const cron = require('node-cron');
const Order = require('../database/models/order.model');
const Vehicle = require('../database/models/vehicle.model');
const brokerService = require('../services/broker.service');

const DEFAULT_CRON_EXPRESSION = '*/5 * * * *';
const DEFAULT_MAX_ORDERS = 20;
const DEFAULT_VEHICLE_LIMIT = 12;
const BUSY_VEHICLE_STATUSES = ['ASSIGNED', 'IN_TRANSIT'];

const parsePositiveInteger = (value, fallback) => {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed <= 0) {
		return fallback;
	}

	return parsed;
};

const normalizeVehicleType = (value) => {
	if (value === undefined || value === null) return null;

	const normalized = String(value).trim();
	if (!normalized) return null;

	return normalized;
};

const cronExpression = process.env.DISPATCHER_AUTO_ASSIGN_CRON || DEFAULT_CRON_EXPRESSION;
const ordersPerRun = parsePositiveInteger(process.env.DISPATCHER_MAX_ORDERS_PER_RUN, DEFAULT_MAX_ORDERS);
const vehicleLimit = parsePositiveInteger(process.env.DISPATCHER_VEHICLE_SEARCH_LIMIT, DEFAULT_VEHICLE_LIMIT);
const autoAssignEnabled = (process.env.DISPATCHER_AUTO_ASSIGN_ENABLED || 'true').toLowerCase() !== 'false';
const systemUser = {
    _id: process.env.DISPATCHER_SYSTEM_USER_ID || 'DISPATCHER_SYSTEM',
    role: 'SUPER_ADMIN , COMPANY_ADMIN',
    
};

let scheduledTask = null;

const selectVehicleForOrder = async (order, blockedVehicleIds) => {
	if (!order.targetCompanyId) {
		return null;
	}

	const filter = {
		companyId: order.targetCompanyId,
		active: true,
		status: 'ACTIVE',
	};

	const requiredVehicleType = normalizeVehicleType(order.vehicleRequirements?.vehicleType);
	if (requiredVehicleType) {
		filter.vehicleType = new RegExp(`^${requiredVehicleType}$`, 'i');
	}

	const minimumCapacity = Number(order.vehicleRequirements?.minimumCapacityKg || 0);
	if (minimumCapacity > 0) {
		filter.capacityKg = { $gte: minimumCapacity };
	}

	const vehicles = await Vehicle.find(filter)
		.select('plateNumber vehicleType capacityKg')
		.sort({ capacityKg: 1, updatedAt: 1 })
		.limit(vehicleLimit)
		.lean();

	if (!vehicles.length) {
		return null;
	}

	const vehicleIds = vehicles.map((vehicle) => vehicle._id);
	const busyVehicleIds = await Order.find({
		assignedVehicleId: { $in: vehicleIds },
		status: { $in: BUSY_VEHICLE_STATUSES },
	}).distinct('assignedVehicleId');

	const busySet = new Set(busyVehicleIds.map((id) => String(id)));

	for (const vehicle of vehicles) {
		const encodedId = String(vehicle._id);
		if (busySet.has(encodedId) || blockedVehicleIds.has(encodedId)) {
			continue;
		}

		return vehicle;
	}

	return null;
};

const runAutoVehicleAssignment = async () => {
	if (!ordersPerRun) {
		console.info('[Dispatcher] Auto vehicle assignment skipped because ordersPerRun is 0');
		return;
	}

	const orders = await Order.find({
		assignmentMode: 'DIRECT_COMPANY',
		status: 'ACCEPTED',
		assignedVehicleId: null,
		postStatus: 'ACTIVE',
		targetCompanyId: { $exists: true, $ne: null },
	})
		.select('_id orderNumber targetCompanyId vehicleRequirements status updatedAt')
		.sort({ updatedAt: 1 })
		.limit(ordersPerRun)
		.lean();

	if (!orders.length) {
		console.info('[Dispatcher] Auto vehicle assignment found no eligible orders');
		return;
	}

	const blockedVehicleIds = new Set();
	let processed = 0;
	let assigned = 0;
	let skipped = 0;
	let failures = 0;

	for (const order of orders) {
		processed += 1;

		const vehicle = await selectVehicleForOrder(order, blockedVehicleIds);
		if (!vehicle) {
			skipped += 1;
			// Set assignment failure reason
			await Order.findByIdAndUpdate(order._id, {
			  assignmentFailureReason: 'No available vehicle matches requirements',
			});
			continue;
		}

		try {
			await brokerService.assignVehicle(systemUser, order._id, { vehicleId: vehicle._id });
			assigned += 1;
			blockedVehicleIds.add(String(vehicle._id));
			console.info(
				`[Dispatcher] Order ${order.orderNumber || order._id} auto-bound to vehicle ${vehicle.plateNumber}`
			);
		} catch (error) {
			failures += 1;
			console.error(
				`[Dispatcher] Failed to auto-assign vehicle for order ${order.orderNumber || order._id}`,
				error.message || error
			);
		}
	}

	console.info(
		`[Dispatcher] Auto assignment run processed=${processed} assigned=${assigned} skipped=${skipped} errors=${failures}`
	);
};

const startAutoVehicleAssignmentJob = () => {
	if (!autoAssignEnabled) {
		console.info('[Dispatcher] Auto vehicle assignment is disabled via DISPATCHER_AUTO_ASSIGN_ENABLED');
		return;
	}

	if (scheduledTask) {
		console.info('[Dispatcher] Auto vehicle assignment job already scheduled');
		return;
	}

	if (!cron.validate(cronExpression)) {
		console.error(
			`[Dispatcher] Invalid cron expression (${cronExpression}) for auto vehicle assignment job`
		);
		return;
	}

	scheduledTask = cron.schedule(
		cronExpression,
		() => {
			runAutoVehicleAssignment().catch((error) => {
				console.error('[Dispatcher] Auto vehicle assignment job failed', error);
			});
		},
		{ scheduled: true }
	);

	console.info(
		`[Dispatcher] Auto vehicle assignment job scheduled (${cronExpression}) with max ${ordersPerRun} orders per run`
	);

	runAutoVehicleAssignment().catch((error) => {
		console.error('[Dispatcher] Initial auto vehicle assignment run failed', error);
	});
};

module.exports = {
	startAutoVehicleAssignmentJob,
};
