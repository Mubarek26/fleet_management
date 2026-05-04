const express = require('express');
const roleController = require('../controllers/role.controller');
const authController = require('../controllers/auth.controller');
const { requirePermissions } = require('../middleware/authorize.middleware');

const router = express.Router();

router.use(authController.protect);

// Role management requires roles:manage permission
router.get('/', requirePermissions('roles:manage'), roleController.listRoles);
router.post('/', requirePermissions('roles:manage'), roleController.createRole);
router.get('/:id', requirePermissions('roles:manage'), roleController.getRole);
router.patch('/:id', requirePermissions('roles:manage'), roleController.updateRole);
router.delete('/:id', requirePermissions('roles:manage'), roleController.deleteRole);
router.post('/:id/assign', requirePermissions('roles:manage'), roleController.assignRoleToUser);

module.exports = router;
