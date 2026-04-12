const express = require('express');
const router = express.Router();
const driverTripController = require('../controllers/driverTrip.controller');
const authController = require('../controllers/auth.controller');

router.use(authController.protect);

// GET /api/v1/driver/trips/history
router.get('/trips/history', driverTripController.getMyTripHistory);

module.exports = router;
