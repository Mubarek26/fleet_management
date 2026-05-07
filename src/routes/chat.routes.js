const express = require('express');
const authController = require('../controllers/auth.controller');
const chatController = require('../controllers/chat.controller');

const router = express.Router();

// All chat routes require authentication
router.use(authController.protect);

router.get('/conversations', chatController.getMyConversations);

router.route('/conversations/:conversationId/messages')
	.get(chatController.getConversationMessages)
	.post(chatController.sendMessage);

router.get('/orders/:orderId/conversation', chatController.getConversationByOrder);

router.patch('/conversations/:conversationId/read', chatController.markAsRead);

module.exports = router;
