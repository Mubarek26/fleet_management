const cron = require('node-cron');
const Trip = require('../database/models/trip.model');
const IdleEvent = require('../database/models/idleEvent.model');
const turf = require('@turf/turf');

const DEFAULT_CRON_EXPRESSION = '*/1 * * * *'; // every 1 minute
const IDLE_DISTANCE_THRESHOLD_METERS = 10; // increased for GPS noise
const IDLE_TIME_THRESHOLD_MINUTES = 2;
const MIN_POINTS_REQUIRED = 0;

let scheduledTask = null;

async function detectIdleTrips() {
	const now = new Date();
	const idleWindowStart = new Date(
		now.getTime() - IDLE_TIME_THRESHOLD_MINUTES * 60 * 1000
	);

	// Only active trips that are actually moving, including vehicle details for notification
	const trips = await Trip.find({
		active: true,
		milestone: { $in: ['STARTED', 'IN_TRANSIT'] }, // Monitor both started and in-transit trips
	}).populate('vehicleId');

	console.log(`[IdleDetection] Checking ${trips.length} active trips at ${now.toISOString()}`);

	for (const trip of trips) {
		if (!trip.locationHistory || trip.locationHistory.length === 0) {
			console.log(`[IdleDetection] Trip ${trip._id} has no location history, skipping.`);
			continue;
		}

		// ✅ Filter locations within time window
		const windowLocations = trip.locationHistory.filter(
			(loc) => new Date(loc.timestamp) >= idleWindowStart
		);

		// ✅ Ensure enough data points
		if (windowLocations.length < MIN_POINTS_REQUIRED) {
			console.log(`[IdleDetection] Trip ${trip._id} has insufficient points (${windowLocations.length}), skipping.`);
			continue;
		}

		// ✅ Calculate max distance within window
		let maxDistance = 0;

		for (let i = 0; i < windowLocations.length; i++) {
			for (let j = i + 1; j < windowLocations.length; j++) {
				const from = turf.point(windowLocations[i].coordinates);
				const to = turf.point(windowLocations[j].coordinates);

				const d = turf.distance(from, to, { units: 'meters' });
				if (d > maxDistance) maxDistance = d;
			}
		}

		console.log(`[IdleDetection] Trip ${trip._id} max distance in window: ${maxDistance.toFixed(1)}m`);

		// ✅ Check existing idle event
		const existingIdle = await IdleEvent.findOne({
			tripId: trip._id,
			resolved: false,
		});

		// 🚨 IDLE DETECTED
		if (maxDistance < IDLE_DISTANCE_THRESHOLD_METERS) {
			if (!existingIdle) {
				const newIdleEvent = await IdleEvent.create({
					tripId: trip._id,
					driverId: trip.driverId,
					detectedAt: now,
					location: windowLocations[windowLocations.length - 1],
					distanceMoved: maxDistance,
					idleDurationMinutes: IDLE_TIME_THRESHOLD_MINUTES,
					history: windowLocations.map((loc) => ({
						coordinates: loc.coordinates,
						timestamp: loc.timestamp, // ✅ correct timestamp
					})),
					notes: `Idle detected at ${now.toISOString()}`,
				});

				trip.lastNote = `IDLE detected at ${now.toISOString()}`;
				trip.isIdle = true;
				await trip.save();

				console.log(
					`[IdleDetection] Trip ${trip._id} marked IDLE (maxDistance: ${maxDistance.toFixed(1)}m)`
				);

				// 🔔 SEND NOTIFICATION
				if (trip.vehicleId && trip.vehicleId.companyId) {
					console.log(`[IdleDetection] Triggering notification for company: ${trip.vehicleId.companyId}`);
					const notificationService = require('../services/notification.service');
					await notificationService.notifyCompanyAdmins(trip.vehicleId.companyId, {
						title: '🚨 Vehicle Idle Alert',
						message: `Vehicle ${trip.vehicleId.plateNumber} has been idle for ${IDLE_TIME_THRESHOLD_MINUTES} minutes.`,
						type: 'IDLE_ALERT',
						metadata: {
							tripId: trip._id,
							vehicleId: trip.vehicleId._id,
							idleEventId: newIdleEvent._id
						}
					});
				} else {
					console.warn(`[IdleDetection] Skip notification: Vehicle or CompanyId missing for trip ${trip._id}`);
				}
			} else {
				console.log(`[IdleDetection] Trip ${trip._id} already has unresolved idle event.`);
			}
		} else {
			// ✅ RESOLVE IDLE if movement detected
			if (existingIdle) {
				await IdleEvent.updateOne(
					{ _id: existingIdle._id },
					{
						resolved: true,
						resolvedAt: now,
					}
				);
				
				trip.isIdle = false;
				await trip.save();

				console.log(
					`[IdleDetection] Trip ${trip._id} IDLE resolved (movement: ${maxDistance.toFixed(1)}m)`
				);
			} else {
				console.log(`[IdleDetection] Trip ${trip._id} is not idle.`);
			}
		}
	}
}

function startIdleDetectionJob() {
	if (scheduledTask) {
		console.info('[IdleDetection] Job already running');
		return;
	}

	scheduledTask = cron.schedule(
		DEFAULT_CRON_EXPRESSION,
		() => {
			detectIdleTrips().catch((err) => {
				console.error('[IdleDetection] Error:', err);
			});
		},
		{ scheduled: true }
	);

	console.info(`[IdleDetection] Job started (${DEFAULT_CRON_EXPRESSION})`);

	// Run immediately on startup
	detectIdleTrips().catch((err) => {
		console.error('[IdleDetection] Initial run error:', err);
	});
}

module.exports = {
	startIdleDetectionJob,
};