const express = require('express');
const authController = require('../controllers/auth.controller');
const orderController = require('../controllers/order.controller');

const router = express.Router();

router.post('/marketplace', authController.protect, orderController.createMarketplaceOrder);

module.exports = router;
