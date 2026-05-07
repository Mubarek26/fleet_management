const chatService = require('../services/chat.service');
const catchAsync = require('../utils/catchAsync');

/**
 * Get all conversations for the logged-in user
 */
exports.getMyConversations = catchAsync(async (req, res) => {
	const conversations = await chatService.getConversations(req.user);
	res.status(200).json({
		status: 'success',
		results: conversations.length,
		data: {
			conversations
		}
	});
});

/**
 * Get messages for a specific conversation
 */
exports.getConversationMessages = catchAsync(async (req, res) => {
	const { conversationId } = req.params;
	const { page, limit } = req.query;
	
	const messages = await chatService.getMessages(
		conversationId, 
		req.user, 
		page ? parseInt(page) : 1, 
		limit ? parseInt(limit) : 50
	);

	res.status(200).json({
		status: 'success',
		results: messages.length,
		data: {
			messages
		}
	});
});

/**
 * Send a message in a conversation
 */
exports.sendMessage = catchAsync(async (req, res) => {
	const { conversationId } = req.params;
	const { text, type, metadata } = req.body;
	
	const message = await chatService.sendMessage(
		conversationId, 
		req.user, 
		text, 
		type, 
		metadata
	);

	res.status(201).json({
		status: 'success',
		data: {
			message
		}
	});
});

/**
 * Mark a conversation as read for the current user
 */
exports.markAsRead = catchAsync(async (req, res) => {
	const { conversationId } = req.params;
	
	const conversation = await chatService.markAsRead(conversationId, req.user);

	res.status(200).json({
		status: 'success',
		data: {
			conversation
		}
	});
});

/**
 * Get conversation by order ID
 */
exports.getConversationByOrder = catchAsync(async (req, res) => {
	const { orderId } = req.params;
	const { participantId } = req.query;
	const conversation = await chatService.getConversationByOrder(orderId, req.user, participantId);

	res.status(200).json({
		status: 'success',
		data: {
			conversation
		}
	});
});
