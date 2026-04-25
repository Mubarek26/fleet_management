const express = require('express');
const geofenceController = require('../controllers/geofence.controller');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.use(authController.protect);

router.get('/by-trip/:tripId', geofenceController.getGeofencesByTrip);

router.post(
  '/', 
  authController.restrictTo('SUPER_ADMIN', 'COMPANY_ADMIN'),
  geofenceController.createGeofence
);

router.get('/', geofenceController.getAllGeofences);

router.get('/:id', geofenceController.getGeofence);

router.put(
  '/:id', 
  authController.restrictTo('SUPER_ADMIN', 'COMPANY_ADMIN'),
  geofenceController.updateGeofence
);

router.delete(
  '/:id', 
  authController.restrictTo('SUPER_ADMIN', 'COMPANY_ADMIN'),
  geofenceController.deleteGeofence
);

// Check driver location for a trip against geofences
router.post('/check-location', geofenceController.checkDriverLocation);

module.exports = router;
