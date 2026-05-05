const express = require('express');
const router = express.Router();
const driverCommissionController = require('../controllers/driverCommission.controller');
const authController = require('../controllers/auth.controller');
const { requirePermissions } = require('../middleware/authorize.middleware');

// All endpoints require driver authentication
router.use(authController.protect);

// GET /api/v1/driver/commission
router.get('/commission', requirePermissions('driver:commission:read'), driverCommissionController.getMyCommissionSummary);
// GET /api/v1/driver/commission/history
router.get('/commission/history', requirePermissions('driver:commission:history'), driverCommissionController.getMyCommissionHistory);
// GET /api/v1/driver/wallet
router.get('/wallet', requirePermissions('driver:wallet:read'), driverCommissionController.getMyWallet);

module.exports = router;
