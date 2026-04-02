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

// Driver order action endpoints
router.patch(
	'/assignments/:orderId/accept',
	authController.protect,
	authController.restrictTo('DRIVER', 'SUPER_ADMIN'),
	driverController.acceptOrderAssignment
);
router.patch(
	'/assignments/:orderId/reject',
	authController.protect,
	authController.restrictTo('DRIVER', 'SUPER_ADMIN'),
	driverController.rejectOrderAssignment
);
router.patch(
	'/assignments/:orderId/start',
	authController.protect,
	authController.restrictTo('DRIVER', 'SUPER_ADMIN'),
	driverController.startOrderAssignment
);
router.patch(
	'/assignments/:orderId/arrive',
	authController.protect,
	authController.restrictTo('DRIVER', 'SUPER_ADMIN'),
	driverController.arriveAtPickup
);
router.patch(
	'/assignments/:orderId/complete',
	authController.protect,
	authController.restrictTo('DRIVER', 'SUPER_ADMIN'),
	driverController.completeOrderAssignment
);

module.exports = router;
