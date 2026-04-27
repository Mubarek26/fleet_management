// pricingConfig.routes.js
const express = require('express');
const pricingConfigController = require('../controllers/pricingConfig.controller');
const authController = require('../controllers/auth.controller');
const router = express.Router();

// Get current pricing config (publicly accessible for calculations)
router.get('/', pricingConfigController.getPricingConfig);

// Update pricing config (Super Admin only)
router.put('/', authController.protect, authController.restrictTo('SUPER_ADMIN'), pricingConfigController.updatePricingConfig);

module.exports = router;
