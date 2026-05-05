const express = require('express');
const geofenceController = require('../controllers/geofence.controller');
const authController = require('../controllers/auth.controller');

const router = express.Router();
const { requirePermissions } = require('../middleware/authorize.middleware');

router.use(authController.protect);

router.get('/by-trip/:tripId', geofenceController.getGeofencesByTrip);

router.post(
  '/', 
  requirePermissions('geofence:create'),
  geofenceController.createGeofence
);

router.get('/', geofenceController.getAllGeofences);

router.get('/:id', geofenceController.getGeofence);

router.put(
  '/:id', 
  requirePermissions('geofence:update'),
  geofenceController.updateGeofence
);

router.delete(
  '/:id', 
  requirePermissions('geofence:delete'),
  geofenceController.deleteGeofence
);

// Check driver location for a trip against geofences
router.post('/check-location', geofenceController.checkDriverLocation);

module.exports = router;
