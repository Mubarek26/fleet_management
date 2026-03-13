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

module.exports = router;
