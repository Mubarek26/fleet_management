const express = require('express');
const router = express.Router();
const vendorApplicationController = require('../controllers/vendorApplication.controller');
const upload = require('../middleware/uploads.middleware');
const authController = require('../controllers/auth.controller');

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
router.get('/:id', authController.protect, authController.restrictTo('SUPER_ADMIN'), vendorApplicationController.getApplicationById);

// List all applications (admin only)
router.get('/', authController.protect, authController.restrictTo('SUPER_ADMIN'), vendorApplicationController.getAllApplications);

// Update application status (admin only)
router.patch('/:id/status', authController.protect, authController.restrictTo('SUPER_ADMIN'), vendorApplicationController.updateApplicationStatus);

module.exports = router;
