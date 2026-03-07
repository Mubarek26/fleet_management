const express = require('express');
const authController = require('../controllers/auth.controller');
const contractController = require('../controllers/contract.controller');

const router = express.Router();

router.post('/initiate', authController.protect, contractController.initiateContract);
router.get('/vendor', authController.protect, contractController.getVendorContracts);
router.get('/company', authController.protect, contractController.getCompanyContracts);
router.put('/:id/approve', authController.protect, contractController.approveContract);
router.put('/:id/terminate', authController.protect, contractController.terminateContract);

module.exports = router;
