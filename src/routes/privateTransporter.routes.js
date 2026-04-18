const express = require('express');
const router = express.Router();
const privateTransporterController = require('../controllers/privateTransporter.controller');

// You may want to add multer middleware here for file uploads
const upload = require('../middleware/uploads.middleware');

const authController = require('../controllers/auth.controller');
// POST /api/private-transporter/apply (protected)
router.post('/apply', authController.protect, upload.fields([
  { name: 'driversLicenseImage', maxCount: 1 },
  { name: 'vehicleRegistrationImage', maxCount: 1 },
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'nationalIdOrPassportImage', maxCount: 1 }
]), privateTransporterController.apply);

// Get my application (protected)
router.get('/my-application', authController.protect, privateTransporterController.getMyApplication);

// Delete my application (protected)
router.delete('/my-application', authController.protect, privateTransporterController.deleteMyApplication);

// Get application by ID (admin only)
router.get('/:id', authController.protect, authController.restrictTo('SUPER_ADMIN'), privateTransporterController.getApplicationById);

// List all applications (admin only)
router.get('/', authController.protect, authController.restrictTo('SUPER_ADMIN'), privateTransporterController.getAllApplications);

// Update application status (admin only)
router.patch('/:id/status', authController.protect, authController.restrictTo('SUPER_ADMIN'), privateTransporterController.updateApplicationStatus);

// Assign driver to company (admin only)
router.post('/:id/assign-company', authController.protect, authController.restrictTo('SUPER_ADMIN'), privateTransporterController.assignToCompany);

module.exports = router;
