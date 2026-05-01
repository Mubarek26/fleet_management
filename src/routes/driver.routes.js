const express = require('express');
const authController = require('../controllers/auth.controller');
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
	authController.restrictTo('DRIVER', 'SUPER_ADMIN'),
	upload.single('file'), // expects multipart/form-data with 'file'
	tripProofController.uploadProofOfDelivery
);

// Proof of Delivery: Verify OTP
router.post(
	'/trips/:id/verify-otp',
	authController.restrictTo('DRIVER', 'SUPER_ADMIN'),
	tripProofController.verifyDeliveryOtp
);



router.get(
	'/assignments',
	authController.restrictTo('DRIVER', 'SUPER_ADMIN'),
	driverController.getMyAssignments
);

router.patch(
	'/status',
	authController.restrictTo('DRIVER', 'SUPER_ADMIN', 'COMPANY_ADMIN'),
	driverController.updateMyStatus
);

router.post(
	'/vehicles/assign',
	authController.restrictTo('COMPANY_ADMIN', 'SUPER_ADMIN'),
	driverController.assignVehicleToDriver
);

router.post(
	'/vehicles/unassign',
	authController.restrictTo('COMPANY_ADMIN', 'SUPER_ADMIN'),
	driverController.unassignVehicleFromDriver
);

router.post(
	'/vehicles/reassign',
	authController.restrictTo('COMPANY_ADMIN', 'SUPER_ADMIN'),
	driverController.reassignVehicleForDriver
);

// Driver order action endpoints
router.patch(
	'/assignments/:orderId/accept',
	authController.restrictTo('DRIVER', 'SUPER_ADMIN'),
	driverController.acceptOrderAssignment
);
router.patch(
	'/assignments/:orderId/reject',
	authController.restrictTo('DRIVER', 'SUPER_ADMIN'),
	driverController.rejectOrderAssignment
);
router.patch(
	'/assignments/:orderId/start',
	authController.restrictTo('DRIVER', 'SUPER_ADMIN', 'COMPANY_ADMIN'),
	driverController.startOrderAssignment
);
router.patch(
	'/assignments/:orderId/arrive',
	authController.restrictTo('DRIVER', 'SUPER_ADMIN'),
	driverController.arriveAtPickup
);
router.patch(
	'/assignments/:orderId/complete',
	authController.restrictTo('DRIVER', 'SUPER_ADMIN'),
	driverController.completeOrderAssignment
);


// POST /api/driver/location - GPS streaming
router.post(
	'/location',
	authController.restrictTo('DRIVER', 'SUPER_ADMIN'),
	require('../controllers/driver.controller').streamLocation
);

// Driver initiated withdrawals
const companyWalletController = require('../controllers/companyWallet.controller');
router.get('/withdrawals', authController.restrictTo('DRIVER', 'SUPER_ADMIN'), companyWalletController.getDriverWithdrawals);
router.post('/withdrawals', authController.restrictTo('DRIVER', 'SUPER_ADMIN'), companyWalletController.createWithdrawal);

// Driver maintenance report (with optional photos)
router.post(
	'/maintenance/report',
	authController.restrictTo('DRIVER', 'SUPER_ADMIN'),
	upload.any(),
	require('../controllers/maintenance.controller').reportMaintenance
);

// Driver: list my reported maintenance issues
router.get(
	'/maintenance',
	authController.restrictTo('DRIVER', 'SUPER_ADMIN'),
	require('../controllers/maintenance.controller').getMyReports
);

// GET my driver profile (includes assigned vehicle)
router.get('/profile', authController.restrictTo('DRIVER', 'SUPER_ADMIN'), async (req, res, next) => {
	try {
		const Driver = require('../database/models/driver.model');
		const driver = await Driver.findOne({ userId: req.user._id }).lean();
		if (!driver) return res.status(404).json({ status: 'fail', message: 'Driver profile not found' });
		res.status(200).json({ status: 'success', data: driver });
	} catch (err) {
		next(err);
	}
});

module.exports = router;
