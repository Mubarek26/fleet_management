const express = require('express');
const router = express.Router();
const commissionConfigController = require('../controllers/commissionConfig.controller');
const authController = require('../controllers/auth.controller');

// Protect and restrict as needed (e.g., admin only)
router.use(authController.protect);
router.get('/commission', commissionConfigController.getCommissionConfig);
router.patch('/commission', commissionConfigController.updateCommissionConfig);

module.exports = router;
