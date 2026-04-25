const turf = require('@turf/turf');
const Geofence = require('../database/models/Geofence.model');

/**
 * Checks a point against a list of geofences
 * @param {Array} coordinates [longitude, latitude]
 * @param {Array} geofences Array of geofence objects
 * @returns {String} Current status ('Off Route', 'In Restricted Zone', etc.)
 */
exports.checkLocationAgainstGeofences = (coordinates, geofences) => {
  if (!geofences || geofences.length === 0) return 'No Geofences';

  const point = turf.point(coordinates);
  let status = 'On Route'; // Default if geofences exist

  for (const gf of geofences) {
    if (gf.type === 'start' || gf.type === 'destination' || gf.type === 'restricted') {
      // Circle geofence (Point + Radius)
      if (gf.geometry.type === 'Point') {
        const center = gf.geometry.coordinates;
        const radiusKm = (gf.radius || 500) / 1000; // default 500m
        const distance = turf.distance(point, turf.point(center), { units: 'kilometers' });

        if (distance <= radiusKm) {
          if (gf.type === 'restricted') return `In Restricted Zone: ${gf.name}`;
          return `In ${gf.name} (${gf.type})`;
        }

        // Proximity alert: within 5km of the boundary
        if (gf.type === 'restricted' && distance <= radiusKm + 2.0) {
          return `Approaching Restricted Zone: ${gf.name}`;
        }
      }

      // Polygon geofence
      if (gf.geometry.type === 'Polygon') {
        if (turf.booleanPointInPolygon(point, gf.geometry)) {
          if (gf.type === 'restricted') return `In Restricted Zone: ${gf.name}`;
          return `In ${gf.name}`;
        }

        // For polygon proximity, we'll use a 5km buffer polygon
        if (gf.type === 'restricted') {
          const bufferPoly = turf.buffer(gf.geometry, 5, { units: 'kilometers' });
          if (turf.booleanPointInPolygon(point, bufferPoly)) {
            return `Approaching Restricted Zone: ${gf.name}`;
          }
        }
      }
    } else if (gf.type === 'corridor' && gf.geometry.type === 'LineString') {
      // Buffer the route line
      const bufferKm = (gf.buffer || 0.5); // default 500m
      const corridor = turf.buffer(gf.geometry, bufferKm, { units: 'kilometers' });
      if (turf.booleanPointInPolygon(point, corridor)) {
        return 'On Route Corridor';
      } else {
        status = 'Off Route Corridor';
      }
    }
  }

  return status;
};
