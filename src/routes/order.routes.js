const express = require('express');
const authController = require('../controllers/auth.controller');
const orderController = require('../controllers/order.controller');
const orderProposalController = require('../controllers/orderProposal.controller');
const { requirePermissions } = require('../middleware/authorize.middleware');

const router = express.Router();

router.get('/mine', authController.protect, requirePermissions('orders:list'), orderController.getMyCreatedOrders);
router.get('/proposals/mine', authController.protect, requirePermissions('proposals:read'), orderProposalController.listMyProposals);
router.get('/marketplace', authController.protect, requirePermissions('orders:list'), orderController.getOpenMarketplaceOrders);
router.post('/marketplace', authController.protect, requirePermissions('orders:create'), orderController.createMarketplaceOrder);
router.get('/:orderId', authController.protect, requirePermissions('orders:read'), orderController.getOrder);
router.post('/:orderId/proposals', authController.protect, requirePermissions('orders:proposals:submit'), orderProposalController.submitProposal);
router.get('/:orderId/proposals', authController.protect, requirePermissions('proposals:read'), orderProposalController.listOrderProposals);

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
	requirePermissions('orders:accept'),
	orderController.acceptOrderByCompany
);
router.patch(
	'/:orderId/reject',
	authController.protect,
	requirePermissions('orders:reject'),
	orderController.rejectOrderByCompany
);

router.patch(
	'/:orderId/admin-reject',
	authController.protect,
	requirePermissions('orders:admin_reject'),
	orderController.adminRejectOrderPost
);

// Assign driver and vehicle to order
router.post('/:orderId/assign', authController.protect, requirePermissions('orders:assign'), orderController.assignOrder);

module.exports = router;
