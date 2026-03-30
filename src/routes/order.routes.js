const express = require('express');
const authController = require('../controllers/auth.controller');
const orderController = require('../controllers/order.controller');
const orderProposalController = require('../controllers/orderProposal.controller');

const router = express.Router();

router.get('/mine', authController.protect, orderController.getMyCreatedOrders);
router.get('/proposals/mine', authController.protect, orderProposalController.listMyProposals);
router.get('/marketplace', authController.protect, orderController.getOpenMarketplaceOrders);
router.post('/marketplace', authController.protect, orderController.createMarketplaceOrder);
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

module.exports = router;
