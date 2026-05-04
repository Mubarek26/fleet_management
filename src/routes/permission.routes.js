const express = require('express');
const permissionController = require('../controllers/permission.controller');
const authController = require('../controllers/auth.controller');
const { requirePermissions } = require('../middleware/authorize.middleware');

const router = express.Router();
router.use(authController.protect);

// List permissions available to authenticated users
router.get('/', requirePermissions('permissions:read'), permissionController.listPermissions);
// Create new permission (super admin only)
router.post('/', requirePermissions('permissions:manage'), permissionController.createPermission);

module.exports = router;
