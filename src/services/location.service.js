const Trip = require('../database/models/trip.model');
const AppError = require('../utils/appError');
const geofenceService = require('./geofence.service');

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
exports.updateDriverLocation = async ({ tripId, driverId, location }) => {
  if (!tripId || !location || location.type !== 'Point' || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
    throw new AppError('tripId and location (GeoJSON Point) are required', 400);
  }
  const [lng, lat] = location.coordinates.map(Number);
  if (isNaN(lng) || isNaN(lat)) {
    throw new AppError('Coordinates must be numbers.', 400);
  }
  const trip = await Trip.findById(tripId).populate('geofences');
  if (!trip) throw new AppError('Trip not found', 404);
  if (String(trip.driverId) !== String(driverId)) {
    throw new AppError('Trip does not belong to this driver', 403);
  }

  // Geofence Check
  const geofenceStatus = geofenceService.checkLocationAgainstGeofences([lng, lat], trip.geofences);
  
  // Update current location and append to history
  trip.location = { type: 'Point', coordinates: [lng, lat], speed: location.speed, heading: location.heading };
  trip.locationHistory = trip.locationHistory || [];
  trip.locationHistory.push({ type: 'Point', coordinates: [lng, lat], speed: location.speed, heading: location.heading, at: new Date() });
  
  // Also update lastLocation and status
  trip.lastLocation = {
    lat,
    lng,
    speed: location.speed,
    heading: location.heading
  };
  trip.lastNote = `Geofence Status: ${geofenceStatus}`;
  
  await trip.save();
  
  // Return trip with geofenceStatus added for the controller to use
  const tripObj = trip.toObject();
  tripObj.geofenceStatus = geofenceStatus;
  
  return tripObj;
};
