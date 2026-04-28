const express = require('express');
const router = express.Router();
const commissionConfigController = require('../controllers/commissionConfig.controller');
const authController = require('../controllers/auth.controller');

// Only SUPER_ADMIN can manage global configuration
router.use(authController.protect);
router.use(authController.restrictTo('SUPER_ADMIN'));

router.get('/commission', commissionConfigController.getCommissionConfig);
router.patch('/commission', commissionConfigController.updateCommissionConfig);

module.exports = router;
