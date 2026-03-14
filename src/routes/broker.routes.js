const express = require('express');
const authController = require('../controllers/auth.controller');
const brokerController = require('../controllers/broker.controller');

const router = express.Router();

router.get(
	'/match/:orderId',
	authController.protect,
	authController.restrictTo('BROKER', 'SUPER_ADMIN','COMPANY_ADMIN','VENDOR','SHIPPER'),
	brokerController.matchOrder
);

router.post(
	'/assign',
	authController.protect,
	authController.restrictTo('BROKER', 'SUPER_ADMIN','COMPANY_ADMIN'),
	brokerController.assignOrder
);

router.post(
	'/orders/:orderId/assign-vehicle',
	authController.protect,
	authController.restrictTo('BROKER', 'SUPER_ADMIN','COMPANY_ADMIN'),
	brokerController.assignVehicle
);

router.put(
	'/orders/:id/validate',
	authController.protect,
	authController.restrictTo('BROKER', 'SUPER_ADMIN','COMPANY_ADMIN','VENDOR','SHIPPER'),
	brokerController.validateOrder
);

module.exports = router;
