const express = require('express');
const router = express.Router();
const vendorApplicationController = require('../controllers/vendorApplication.controller');
const upload = require('../middleware/uploads.middleware');
const authController = require('../controllers/auth.controller');
const { requirePermissions } = require('../middleware/authorize.middleware');

// POST /api/v1/vendor/apply (protected)
router.post('/apply', authController.protect, upload.fields([
  { name: 'businessLicenseImage', maxCount: 1 },
  { name: 'taxIdImage', maxCount: 1 },
  { name: 'companyProfileImage', maxCount: 1 }
]), vendorApplicationController.apply);

// Get my application (protected)
router.get('/my-application', authController.protect, vendorApplicationController.getMyApplication);

// Delete my application (protected)
router.delete('/my-application', authController.protect, vendorApplicationController.deleteMyApplication);

// Get application by ID (admin only)
router.get('/:id', authController.protect, requirePermissions('applications:read'), vendorApplicationController.getApplicationById);

// List all applications (admin only)
router.get('/', authController.protect, requirePermissions('applications:list'), vendorApplicationController.getAllApplications);

// Update application status (admin only)
router.patch('/:id/status', authController.protect, requirePermissions('applications:update'), vendorApplicationController.updateApplicationStatus);

module.exports = router;
