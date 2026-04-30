const express = require('express');
const idleController = require('../controllers/idle.controller');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.use(authController.protect);
router.use(authController.restrictTo('SUPER_ADMIN', 'COMPANY_ADMIN'));

router.get('/', idleController.getAllIdleEvents);
router.patch('/:id/resolve', idleController.resolveIdleEvent);

module.exports = router;
