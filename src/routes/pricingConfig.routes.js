// pricingConfig.routes.js
const express = require('express');
const pricingConfigController = require('../controllers/pricingConfig.controller');

const authController = require('../controllers/auth.controller');
const { requirePermissions } = require('../middleware/authorize.middleware');
const router = express.Router();

// Get current pricing config (publicly accessible for calculations)
router.get('/', pricingConfigController.getPricingConfig);

// Update pricing config (Super Admin only)
router.put('/', authController.protect, requirePermissions('pricing:update'), pricingConfigController.updatePricingConfig);

module.exports = router;
