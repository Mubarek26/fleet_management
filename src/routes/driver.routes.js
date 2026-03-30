const express = require('express');
const authController = require('../controllers/auth.controller');
const driverController = require('../controllers/driver.controller');

const router = express.Router();

router.get(
	'/assignments',
	authController.protect,
	authController.restrictTo('DRIVER', 'SUPER_ADMIN'),
	driverController.getMyAssignments
);

router.patch(
	'/status',
	authController.protect,
	authController.restrictTo('DRIVER', 'SUPER_ADMIN', 'COMPANY_ADMIN'),
	driverController.updateMyStatus
);

router.post(
	'/vehicles/assign',
	authController.protect,
	authController.restrictTo('COMPANY_ADMIN', 'SUPER_ADMIN'),
	driverController.assignVehicleToDriver
);

router.post(
	'/vehicles/unassign',
	authController.protect,
	authController.restrictTo('COMPANY_ADMIN', 'SUPER_ADMIN'),
	driverController.unassignVehicleFromDriver
);

router.post(
	'/vehicles/reassign',
	authController.protect,
	authController.restrictTo('COMPANY_ADMIN', 'SUPER_ADMIN'),
	driverController.reassignVehicleForDriver
);

module.exports = router;
