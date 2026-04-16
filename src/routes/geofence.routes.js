// Get all geofences for a trip by tripId
const express = require('express');
const geofenceController = require('../controllers/geofence.controller');

const router = express.Router();
router.get('/by-trip/:tripId', geofenceController.getGeofencesByTrip);
// Create a new geofence
router.post('/', geofenceController.createGeofence);

// Get all geofences
router.get('/', geofenceController.getAllGeofences);

// Get a single geofence by ID
router.get('/:id', geofenceController.getGeofence);

// Update a geofence
router.put('/:id', geofenceController.updateGeofence);

// Delete a geofence
router.delete('/:id', geofenceController.deleteGeofence);

// Check driver location for a trip against geofences
router.post('/check-location', geofenceController.checkDriverLocation);

module.exports = router;
