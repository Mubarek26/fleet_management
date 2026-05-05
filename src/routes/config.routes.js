const express = require('express');
const router = express.Router();
const commissionConfigController = require('../controllers/commissionConfig.controller');
const authController = require('../controllers/auth.controller');
const { requirePermissions } = require('../middleware/authorize.middleware');

router.use(authController.protect);

router.get('/commission', requirePermissions('config:read'), commissionConfigController.getCommissionConfig);
router.patch('/commission', requirePermissions('config:manage'), commissionConfigController.updateCommissionConfig);

module.exports = router;
