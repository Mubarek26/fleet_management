const express = require('express');
const authController = require('../controllers/auth.controller');
const orderController = require('../controllers/order.controller');
const orderProposalController = require('../controllers/orderProposal.controller');

const router = express.Router();

router.get('/mine', authController.protect, orderController.getMyCreatedOrders);
router.get('/proposals/mine', authController.protect, orderProposalController.listMyProposals);
router.get('/marketplace', authController.protect, orderController.getOpenMarketplaceOrders);
router.post('/marketplace', authController.protect, orderController.createMarketplaceOrder);
router.get('/:orderId', authController.protect, orderController.getOrder);
router.post('/:orderId/proposals', authController.protect, orderProposalController.submitProposal);
router.get('/:orderId/proposals', authController.protect, orderProposalController.listOrderProposals);

router.patch(
	'/:orderId/proposals/:proposalId/accept',
	authController.protect,
	orderProposalController.acceptProposal
);
router.patch(
	'/:orderId/proposals/:proposalId/reject',
	authController.protect,
	orderProposalController.rejectProposal
);
router.patch(
	'/:orderId/proposals/:proposalId/withdraw',
	authController.protect,
	orderProposalController.withdrawProposal
);

// Company/Superadmin accept/reject order
router.patch(
	'/:orderId/accept',
	authController.protect,
	authController.restrictTo('COMPANY_ADMIN', 'SUPER_ADMIN'),
	orderController.acceptOrderByCompany
);
router.patch(
	'/:orderId/reject',
	authController.protect,
	authController.restrictTo('COMPANY_ADMIN', 'SUPER_ADMIN'),
	orderController.rejectOrderByCompany
);

router.patch(
	'/:orderId/admin-reject',
	authController.protect,
	authController.restrictTo('SUPER_ADMIN'),
	orderController.adminRejectOrderPost
);

module.exports = router;

// Assign driver and vehicle to order
router.post('/:orderId/assign', authController.protect, orderController.assignOrder);
