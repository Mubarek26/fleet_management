const express = require('express');
const router = express.Router();
const driverCommissionController = require('../controllers/driverCommission.controller');
const authController = require('../controllers/auth.controller');

// All endpoints require driver authentication
router.use(authController.protect);

// GET /api/v1/driver/commission
router.get('/commission', driverCommissionController.getMyCommissionSummary);
// GET /api/v1/driver/commission/history
router.get('/commission/history', driverCommissionController.getMyCommissionHistory);

module.exports = router;
