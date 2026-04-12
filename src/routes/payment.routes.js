// payment.routes.js
const express = require('express');
const paymentController = require('../controllers/paymentController');
const router = express.Router();

router.post('/initialize', paymentController.initializePayment);
router.get('/callback', paymentController.callBack);
router.get('/verify', paymentController.verifyPayment);

module.exports = router;
