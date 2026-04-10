// pricingConfig.routes.js
const express = require('express');
const pricingConfigController = require('../controllers/pricingConfig.controller');
const router = express.Router();

// Get current pricing config
router.get('/', pricingConfigController.getPricingConfig);

// Update pricing config (admin only - add auth middleware as needed)
router.put('/', pricingConfigController.updatePricingConfig);

module.exports = router;
