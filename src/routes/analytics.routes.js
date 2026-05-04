const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.use(authController.protect);

router.get('/fleet-status', analyticsController.getFleetStatus);
router.get('/dashboard-stats', analyticsController.getDashboardStats);
router.get('/overview', analyticsController.getOverview);
router.get('/export', analyticsController.exportOverview);

module.exports = router;
