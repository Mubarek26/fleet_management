const Trip = require('../database/models/trip.model');
const AppError = require('../utils/appError');

/**
 * Update or create the latest location for a trip.
 * @param {Object} params
 * @param {string} params.tripId
 * @param {string} params.driverId
 * @param {number} params.latitude
 * @param {number} params.longitude
 * @param {number} [params.speed]
 * @param {number} [params.heading]
 * @returns {Promise<Trip>}
 */
exports.updateDriverLocation = async ({ tripId, driverId, latitude, longitude, speed, heading }) => {
  if (!tripId || latitude == null || longitude == null) {
    throw new AppError('tripId, latitude, and longitude are required', 400);
  }
  const trip = await Trip.findById(tripId);
  if (!trip) throw new AppError('Trip not found', 404);
  if (String(trip.driverId) !== String(driverId)) {
    throw new AppError('Trip does not belong to this driver', 403);
  }
  trip.lastLocation = { lat: latitude, lng: longitude };
  if (speed !== undefined) trip.lastLocation.speed = speed;
  if (heading !== undefined) trip.lastLocation.heading = heading;
  await trip.save();
  return trip;
};
