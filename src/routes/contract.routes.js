const express = require('express');
const authController = require('../controllers/auth.controller');
const contractController = require('../controllers/contract.controller');


const { requirePermissions } = require('../middleware/authorize.middleware');
const router = express.Router();

router.post('/initiate', authController.protect, requirePermissions('contracts:create'), contractController.initiateContract);
router.get('/vendor', authController.protect, requirePermissions('contracts:read'), contractController.getVendorContracts);
router.get('/company', authController.protect, requirePermissions('contracts:read'), contractController.getCompanyContracts);
router.put('/:id/approve', authController.protect, requirePermissions('contracts:approve'), contractController.approveContract);
router.put('/:id/terminate', authController.protect, requirePermissions('contracts:terminate'), contractController.terminateContract);

module.exports = router;
