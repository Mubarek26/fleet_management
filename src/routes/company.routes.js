const express = require('express');
const companyController = require('../controllers/company.controller');
const authController = require('../controllers/auth.controller');
const router = express.Router();
const upload = require('../middleware/uploads.middleware');
// Protect all routes after this middleware
router.use(authController.protect);

router
  .route('/')
    .get(companyController.getAllCompanies)
    .post(upload.single('photo'), companyController.createCompany);


router
    .route('/vehicles')
    .get(companyController.getCompanyVehicles)
    .post(companyController.createCompanyVehicle);

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
