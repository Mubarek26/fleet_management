

const turf = require('@turf/turf');
const Geofence = require('../database/models/Geofence.model');
const Trip = require('../database/models/trip.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');



// Get all geofences for a trip by tripId
exports.getGeofencesByTrip = async (req, res) => {
  const { tripId } = req.params;
  const trip = await Trip.findById(tripId).populate('geofences');
  if (!trip) return res.status(404).json({ status: 'fail', message: 'Trip not found' });
  res.status(200).json({ status: 'success', data: trip.geofences });
};

// Create a new geofence
exports.createGeofence = async (req, res) => {
  try {
    const geofence = await Geofence.create(req.body);
    res.status(201).json({ status: 'success', data: geofence });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// Get all geofences
exports.getAllGeofences = async (req, res) => {
  try {
    const geofences = await Geofence.find();
    res.status(200).json({ status: 'success', data: geofences });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// Get a single geofence by ID
exports.getGeofence = async (req, res) => {
  try {
    const geofence = await Geofence.findById(req.params.id);
    if (!geofence) return res.status(404).json({ status: 'fail', message: 'Not found' });
    res.status(200).json({ status: 'success', data: geofence });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// Update a geofence
exports.updateGeofence = async (req, res) => {
  try {
    const geofence = await Geofence.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!geofence) return res.status(404).json({ status: 'fail', message: 'Not found' });
    res.status(200).json({ status: 'success', data: geofence });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// Delete a geofence
exports.deleteGeofence = async (req, res) => {
  try {
    const geofence = await Geofence.findByIdAndDelete(req.params.id);
    if (!geofence) return res.status(404).json({ status: 'fail', message: 'Not found' });
    res.status(204).json({ status: 'success', data: null });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};


// Check driver location for a trip against geofences
exports.checkDriverLocation = catchAsync(async (req, res, next) => {
  const { tripId, longitude, latitude } = req.body;
  const trip = await Trip.findById(tripId).populate('geofences');
  if (!trip) return next(new AppError('Trip not found', 404));

  const point = turf.point([longitude, latitude]);
  let status = 'Off Route';

  for (const gf of trip.geofences) {
    if (gf.type === 'start' || gf.type === 'destination' || gf.type === 'restricted') {
      // Circle geofence
      if (gf.geometry.type === 'Point') {
        const circle = turf.circle(gf.geometry.coordinates, (gf.radius || 0) / 1000, { units: 'kilometers' });
        if (turf.booleanPointInPolygon(point, circle)) {
          status = gf.type === 'restricted' ? 'In Restricted Zone' : `In ${gf.name}`;
          break;
        }
      }
      // Polygon geofence
      if (gf.geometry.type === 'Polygon') {
        if (turf.booleanPointInPolygon(point, gf.geometry)) {
          status = `In ${gf.name}`;
          break;
        }
      }
    } else if (gf.type === 'corridor' && gf.geometry.type === 'LineString') {
      // Buffer the route line
      const corridor = turf.buffer(gf.geometry, gf.buffer || 0.1, { units: 'kilometers' });
      if (turf.booleanPointInPolygon(point, corridor)) {
        status = 'On Route Corridor';
        break;
      }
    }
  }

  res.json({ status });
});