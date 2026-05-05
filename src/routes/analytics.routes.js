const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.use(authController.protect);

const { requireRoles, requirePermissions } = require('../middleware/authorize.middleware');

// Permission-based protection (keys expected to exist in permissions collection)
// Use permission keys seeded in src/config/seedRolesPermissions.js
router.get('/fleet-status', requirePermissions('analytics:read'), analyticsController.getFleetStatus);
router.get('/dashboard-stats', requirePermissions('analytics:read'), analyticsController.getDashboardStats);
router.get('/overview', requirePermissions('analytics:read'), analyticsController.getOverview);
router.get('/export', requirePermissions('analytics:export'), analyticsController.exportOverview);

module.exports = router;
