const express = require('express');
const authController = require('../controllers/auth.controller');
const brokerController = require('../controllers/broker.controller');

const router = express.Router();

router.put(
	'/orders/:id/validate',
	authController.protect,
	authController.restrictTo('BROKER', 'SUPER_ADMIN'),
	brokerController.validateOrder
);

module.exports = router;
