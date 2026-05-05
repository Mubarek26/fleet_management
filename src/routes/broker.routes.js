const express = require('express');
const authController = require('../controllers/auth.controller');
const brokerController = require('../controllers/broker.controller');

const router = express.Router();
const { requirePermissions } = require('../middleware/authorize.middleware');

router.get(
	'/match/:orderId',
	authController.protect,
	requirePermissions('broker:read'),
	brokerController.matchOrder
);

router.post(
	'/assign',
	authController.protect,
	requirePermissions('broker:update'),
	brokerController.assignOrder
);

router.post(
	'/orders/:orderId/assign-vehicle',
	authController.protect,
	requirePermissions('broker:update'),
	brokerController.assignVehicle
);

router.put(
	'/orders/:id/validate',
	authController.protect,
	requirePermissions('broker:update'),
	brokerController.validateOrder
);

module.exports = router;
