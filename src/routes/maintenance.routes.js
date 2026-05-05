const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenance.controller');
const authController = require('../controllers/auth.controller');
const { requirePermissions } = require('../middleware/authorize.middleware');

// Protected routes: require authentication
router.use(authController.protect);

router.route('/')
  .get(maintenanceController.getMaintenanceLogs)
  .post(requirePermissions('maintenance:create'), maintenanceController.createMaintenance);

router.route('/:id')
  .patch(requirePermissions('maintenance:update'), maintenanceController.updateMaintenance)
  .delete(requirePermissions('maintenance:delete'), maintenanceController.deleteMaintenance);

module.exports = router;
