const express = require('express');

const idleController = require('../controllers/idle.controller');
const authController = require('../controllers/auth.controller');
const { requirePermissions } = require('../middleware/authorize.middleware');

const router = express.Router();

router.use(authController.protect);

router.get('/', requirePermissions('idle:read'), idleController.getAllIdleEvents);
router.patch('/:id/resolve', requirePermissions('idle:manage'), idleController.resolveIdleEvent);

module.exports = router;
