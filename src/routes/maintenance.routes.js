const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenance.controller');
const authController = require('../controllers/auth.controller');

// Protected routes: require authentication
router.use(authController.protect);

router.route('/')
  .get(maintenanceController.getMaintenanceLogs)
  .post(authController.restrictTo('SUPER_ADMIN','COMPANY_ADMIN'), maintenanceController.createMaintenance);

router.route('/:id')
  .patch(authController.restrictTo('SUPER_ADMIN','COMPANY_ADMIN'), maintenanceController.updateMaintenance)
  .delete(authController.restrictTo('SUPER_ADMIN','COMPANY_ADMIN'), maintenanceController.deleteMaintenance);

module.exports = router;
