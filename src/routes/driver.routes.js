const express = require('express');
const authController = require('../controllers/auth.controller');
const { requirePermissions } = require('../middleware/authorize.middleware');
const driverController = require('../controllers/driver.controller');
const requireActiveStatus = require('../middleware/requireActiveStatus.middleware');
const upload = require('../middleware/uploads.middleware');
const tripProofController = require('../controllers/tripProof.controller');

const router = express.Router();

// Debug route to verify router is loaded (public)
router.get('/test', (req, res) => res.json({ ok: true }));
router.use(authController.protect);
router.use(requireActiveStatus);

// Proof of Delivery: Upload evidence (photo, signature, note)
router.post(
	'/trips/:id/evidence',
	requirePermissions('trips:update'),
	upload.single('file'), // expects multipart/form-data with 'file'
	tripProofController.uploadProofOfDelivery
);

// Proof of Delivery: Verify OTP
router.post(
	'/trips/:id/verify-otp',
	requirePermissions('trips:update'),
	tripProofController.verifyDeliveryOtp
);



router.get(
	'/assignments',
	requirePermissions('trips:list'),
	driverController.getMyAssignments
);

router.patch(
	'/status',
	requirePermissions('drivers:profile:update'),
	driverController.updateMyStatus
);

router.post(
	'/vehicles/assign',
	requirePermissions('vehicles:update'),
	driverController.assignVehicleToDriver
);

router.post(
	'/vehicles/unassign',
	requirePermissions('vehicles:update'),
	driverController.unassignVehicleFromDriver
);

router.post(
	'/vehicles/reassign',
	requirePermissions('vehicles:update'),
	driverController.reassignVehicleForDriver
);

// Admin: assign existing driver to a company
router.patch(
	'/:driverId/assign-company',
	requirePermissions('drivers:update'),
	driverController.assignDriverToCompany
);

// Admin: assign existing driver to a company by userId
router.patch(
	'/by-user/:userId/assign-company',
	requirePermissions('drivers:update'),
	driverController.assignDriverToCompanyByUser
);

// Driver order action endpoints
router.patch(
	'/assignments/:orderId/accept',
	requirePermissions('trips:update'),
	driverController.acceptOrderAssignment
);
router.patch(
	'/assignments/:orderId/reject',
	requirePermissions('trips:update'),
	driverController.rejectOrderAssignment
);
router.patch(
	'/assignments/:orderId/start',
	requirePermissions('trips:update'),
	driverController.startOrderAssignment
);
router.patch(
	'/assignments/:orderId/arrive',
	requirePermissions('trips:update'),
	driverController.arriveAtPickup
);
router.patch(
	'/assignments/:orderId/complete',
	requirePermissions('trips:update'),
	driverController.completeOrderAssignment
);


// POST /api/driver/location - GPS streaming
router.post(
	'/location',
	requirePermissions('tracking:read'),
	require('../controllers/driver.controller').streamLocation
);

// Driver initiated withdrawals
const companyWalletController = require('../controllers/companyWallet.controller');
router.get('/withdrawals', requirePermissions('drivers:withdrawals:read'), companyWalletController.getDriverWithdrawals);
router.post('/withdrawals', requirePermissions('drivers:withdrawals:create'), companyWalletController.createWithdrawal);

// Driver maintenance report (with optional photos)
router.post(
	'/maintenance/report',
	requirePermissions('maintenance:create'),
	upload.any(),
	require('../controllers/maintenance.controller').reportMaintenance
);

// Driver: list my reported maintenance issues
router.get(
	'/maintenance',
	requirePermissions('maintenance:read'),
	require('../controllers/maintenance.controller').getMyReports
);

// GET my driver profile (includes assigned vehicle)
router.get('/profile', requirePermissions('drivers:profile:read'), async (req, res, next) => {
	try {
		const Driver = require('../database/models/driver.model');
		const driver = await Driver.findOne({ userId: req.user._id }).lean();
		if (!driver) return res.status(404).json({ status: 'fail', message: 'Driver profile not found' });
		res.status(200).json({ status: 'success', data: driver });
	} catch (err) {
		next(err);
	}
});

// Admin route to toggle private transporter flag for a driver
router.patch(
	'/:driverId/private-transporter',
	requirePermissions('drivers:update'),
	require('../controllers/driver.controller').setPrivateTransporterFlag
);

// Admin: set private transporter flag by userId
router.patch(
	'/by-user/:userId/private-transporter',
	requirePermissions('drivers:update'),
	require('../controllers/driver.controller').setPrivateTransporterFlagByUser
);

module.exports = router;
