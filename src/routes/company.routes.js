
// Approve company (SUPER_ADMIN only)
const express = require('express');
const companyController = require('../controllers/company.controller');
const authController = require('../controllers/auth.controller');
const { requirePermissions } = require('../middleware/authorize.middleware');
const router = express.Router();
const upload = require('../middleware/uploads.middleware');

const requireActiveStatus = require('../middleware/requireActiveStatus.middleware');
// Protect all routes after this middleware
router.use(authController.protect);

const companyWalletController = require('../controllers/companyWallet.controller');

// Approve user (SUPER_ADMIN only)
router.route('/users/:id/approve').put(requirePermissions('companies:users:approve'), companyController.approveUser);

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
    .get(authController.protect, companyController.getMyCompany);


router
.route('/vehicles')
.get(companyController.getCompanyVehicles)
.post(companyController.createCompanyVehicle);

router
  .route('/vehicles/all')
  .get(requirePermissions('vehicles:list'), companyController.getAllVehicles);

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
  .get(requirePermissions('drivers:list'), companyController.getAllDrivers);




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
// Company wallet / admin endpoints - define before the generic '/:id' route
router.route('/drivers/wallets').get(requirePermissions('wallet:list'), companyWalletController.getDriversWallets);
router.route('/drivers/:id/transactions').get(requirePermissions('wallet:list'), companyWalletController.getDriverTransactions);
router.route('/drivers/:id/withdrawals').post(requirePermissions('wallet:withdraw'), companyWalletController.createWithdrawal);
router.route('/withdrawals/:id/approve').patch(requirePermissions('wallet:approve'), companyWalletController.approveWithdrawal);
router.route('/withdrawals').get(requirePermissions('wallet:list'), companyWalletController.getWithdrawals);

router
    .route('/:id')
    .get(companyController.getCompany)
    .patch(upload.single('photo'), companyController.updateCompany)
    .delete(companyController.deleteCompany);


module.exports = router;

// handlerFactory.js
