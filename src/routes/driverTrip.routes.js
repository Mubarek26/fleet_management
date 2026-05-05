const express = require('express');
const router = express.Router();
const driverTripController = require('../controllers/driverTrip.controller');
const authController = require('../controllers/auth.controller');
const { requirePermissions } = require('../middleware/authorize.middleware');

router.use(authController.protect);

// GET /api/v1/driver/trips/history
router.get('/trips/history', requirePermissions('trips:list'), driverTripController.getMyTripHistory);

module.exports = router;
