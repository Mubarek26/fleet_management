// Company: Get all trips under their control
const express = require('express');
const authController = require('../controllers/auth.controller');
const requireActiveStatus = require('../middleware/requireActiveStatus.middleware');
const tripController = require('../controllers/trip.controller');
const router = express.Router();

router.use(authController.protect);
router.use(requireActiveStatus);

router.get('/company', authController.restrictTo('COMPANY_ADMIN'), tripController.getCompanyTrips);
router.get('/driver/mine', authController.restrictTo('DRIVER', 'PRIVATE_TRANSPORTER'), tripController.getDriverTrips);

// PATCH /api/driver/trips/:id/milestone

// Lookup: search by tracking/order number or delivery contact phone
// Example: GET /api/v1/trips/lookup?q=ORD-1234 or ?q=+251912345678
router.get('/lookup', tripController.lookupByQuery);

// Trip CRUD endpoints
router.get('/:id', tripController.getTripById); // Get trip details
router.get('/', tripController.getAllTrips); // List trips
router.post('/', tripController.createTrip); // Create trip
router.patch('/:id', tripController.updateTrip); // Update trip
router.delete('/:id', tripController.deleteTrip); // Delete trip

// Real-time tracking info (stub, usually handled by WebSocket)
router.get('/:id/track', tripController.getTripTracking);

// PATCH milestone (existing)
router.patch('/driver/:id/milestone', tripController.updateMilestone);


module.exports = router;
