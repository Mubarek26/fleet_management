
// Approve company (SUPER_ADMIN only)
const express = require('express');
const companyController = require('../controllers/company.controller');
const authController = require('../controllers/auth.controller');
const router = express.Router();
const upload = require('../middleware/uploads.middleware');

const requireActiveStatus = require('../middleware/requireActiveStatus.middleware');
// Protect all routes after this middleware
router.use(authController.protect);

// Approve user (SUPER_ADMIN only)
router.route('/users/:id/approve').put(authController.restrictTo('SUPER_ADMIN'), companyController.approveUser);

// Place approve route before /:id
router
  .route('/:id/approve')
  .put(companyController.approveCompany);

router
  .route('/')
  .get(companyController.getAllCompanies)
  .post(upload.single('photo'), companyController.createCompany);

router
  .route('/me')
  .get(authController.protect, authController.restrictTo('COMPANY_ADMIN', 'SUPER_ADMIN'), companyController.getMyCompany);


router
.route('/vehicles')
.get(companyController.getCompanyVehicles)
.post(companyController.createCompanyVehicle);

router
  .route('/vehicles/all')
  .get(authController.restrictTo('SUPER_ADMIN'), companyController.getAllVehicles);

router
  .route('/vehicles/:id')
  .patch(companyController.updateCompanyVehicle)
  .delete(companyController.deleteCompanyVehicle);

router
  .route('/drivers/:id')
  .patch(upload.fields([
    { name: 'driverPhoto', maxCount: 1 },
    { name: 'licensePhoto', maxCount: 1 }
  ]), companyController.updateCompanyDriver)
  .delete(companyController.deleteCompanyDriver);

router
  .route('/drivers/all')
  .get(authController.restrictTo('SUPER_ADMIN'), companyController.getAllDrivers);


router
    .route('/:id')
    .get(companyController.getCompany)
    .patch(upload.single('photo'), companyController.updateCompany)
    .delete(companyController.deleteCompany);

router
    .route('/:id/drivers')
    .get(companyController.getCompanyDrivers)
    .patch(upload.fields([
      { name: 'driverPhoto', maxCount: 1 },
      { name: 'licensePhoto', maxCount: 1 }
    ]), companyController.updateCompanyDriver)
  .post(
    upload.fields([
      { name: 'driverPhoto', maxCount: 1 },
      { name: 'licensePhoto', maxCount: 1 }
    ]),
    companyController.addDriverToCompany
  );

module.exports = router;

// handlerFactory.js
