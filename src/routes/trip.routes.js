// Company: Get all trips under their control
const express = require('express');
const authController = require('../controllers/auth.controller');
const { requirePermissions } = require('../middleware/authorize.middleware');
const requireActiveStatus = require('../middleware/requireActiveStatus.middleware');
const tripController = require('../controllers/trip.controller');
const router = express.Router();

router.use(authController.protect);
router.use(requireActiveStatus);


router.get('/company', requirePermissions('trips:list'), tripController.getCompanyTrips);
router.get('/driver/mine', requirePermissions('trips:list'), tripController.getDriverTrips);

// PATCH /api/driver/trips/:id/milestone

// Lookup: search by tracking/order number or delivery contact phone
// Example: GET /api/v1/trips/lookup?q=ORD-1234 or ?q=+251912345678
router.get('/lookup', requirePermissions('trips:list'), tripController.lookupByQuery);

// Trip CRUD endpoints
router.get('/:id', requirePermissions('trips:read'), tripController.getTripById); // Get trip details
router.get('/', requirePermissions('trips:list'), tripController.getAllTrips); // List trips
router.post('/', requirePermissions('trips:create'), tripController.createTrip); // Create trip
router.patch('/:id', requirePermissions('trips:update'), tripController.updateTrip); // Update trip
router.delete('/:id', requirePermissions('trips:delete'), tripController.deleteTrip); // Delete trip

// Real-time tracking info (stub, usually handled by WebSocket)
router.get('/:id/track', requirePermissions('trips:track'), tripController.getTripTracking);

// PATCH milestone (existing)
router.patch('/driver/:id/milestone', requirePermissions('trips:update'), tripController.updateMilestone);


module.exports = router;
