const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.use(authController.protect);

router.get('/fleet-status', analyticsController.getFleetStatus);

module.exports = router;
