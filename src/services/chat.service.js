const Conversation = require('../database/models/conversation.model');
const Message = require('../database/models/message.model');
const AppError = require('../utils/appError');
const socketUtils = require('../utils/socket');

/**
 * Create or find a conversation between participants for a specific order
 */
exports.createConversation = async (orderId, participants) => {
	// Check if conversation already exists for this order and these participants
	let conversation = await Conversation.findOne({
		orderId,
		participants: { $all: participants, $size: participants.length }
	});

	if (!conversation) {
		const unreadCount = new Map();
		participants.forEach(id => {
			unreadCount.set(id.toString(), 0);
		});

		conversation = await Conversation.create({
			orderId,
			participants,
			unreadCount
		});
	}

	return conversation;
};

/**
 * Send a message in a conversation
 */
exports.sendMessage = async (conversationId, user, text, type = 'TEXT', metadata = null) => {
	const senderId = user._id;
	const conversation = await Conversation.findById(conversationId);
	if (!conversation) throw new AppError('Conversation not found', 404);

	// Verify sender is participant OR Super Admin
	const isParticipant = conversation.participants.some(p => p.toString() === senderId.toString());
	const isSuperAdmin = user.role === 'SUPER_ADMIN';

	if (!isParticipant && !isSuperAdmin) {
		throw new AppError('You are not a participant in this conversation', 403);
	}

	const message = await Message.create({
		conversationId,
		senderId,
		text,
		type,
		metadata,
		readBy: [{ userId: senderId, readAt: new Date() }]
	});

	// Update conversation last message info
	conversation.lastMessage = {
		text,
		senderId,
		sentAt: message.createdAt
	};

	// Increment unread count for other participants
	conversation.participants.forEach(participantId => {
		const pIdStr = participantId.toString();
		if (pIdStr !== senderId.toString()) {
			const currentCount = conversation.unreadCount.get(pIdStr) || 0;
			conversation.unreadCount.set(pIdStr, currentCount + 1);
		}
	});

	await conversation.save();

	// Emit socket events for real-time updates
	try {
		const io = socketUtils.getIO();
		// Emit to the conversation room
		io.to(`chat_${conversationId}`).emit('new-message', message);
		
		// Emit notifications to individual participants
		conversation.participants.forEach(participantId => {
			const pIdStr = participantId.toString();
			if (pIdStr !== senderId.toString()) {
				io.to(`user_${pIdStr}`).emit('chat-notification', {
					conversationId,
					orderId: conversation.orderId,
					message: text,
					senderId,
					type
				});
			}
		});
	} catch (err) {
		console.error('Socket emission failed in chat service:', err.message);
	}

	return message;
};

/**
 * List conversations for a user
 */
exports.getConversations = async (user) => {
	const query = user.role === 'SUPER_ADMIN' ? {} : { participants: user._id };
	
	return await Conversation.find(query)
		.populate('orderId', 'orderNumber title status')
		.populate('participants', 'fullName photo role')
		.sort({ updatedAt: -1 });
};

/**
 * Get paginated messages for a conversation
 */
exports.getMessages = async (conversationId, user, page = 1, limit = 50) => {
	const userId = user._id;
	const conversation = await Conversation.findById(conversationId);
	if (!conversation) throw new AppError('Conversation not found', 404);

	const isParticipant = conversation.participants.some(p => p.toString() === userId.toString());
	const isSuperAdmin = user.role === 'SUPER_ADMIN';

	if (!isParticipant && !isSuperAdmin) {
		throw new AppError('You are not a participant in this conversation', 403);
	}

	const messages = await Message.find({ conversationId })
		.sort({ createdAt: -1 })
		.skip((page - 1) * limit)
		.limit(limit)
		.populate('senderId', 'fullName photo');

	return messages.reverse();
};

/**
 * Mark all messages in a conversation as read for a user
 */
exports.markAsRead = async (conversationId, user) => {
	const userId = user._id;
	const conversation = await Conversation.findById(conversationId);
	if (!conversation) throw new AppError('Conversation not found', 404);

	// Reset unread count for this user
	if (conversation.unreadCount.has(userId.toString())) {
		conversation.unreadCount.set(userId.toString(), 0);
		await conversation.save();
	}

	// Update read status in messages
	await Message.updateMany(
		{ 
			conversationId, 
			'readBy.userId': { $ne: userId } 
		},
		{ 
			$push: { readBy: { userId, readAt: new Date() } } 
		}
	);

	// Notify other participants via socket? (Optional: read receipts)
	try {
		const io = socketUtils.getIO();
		io.to(`chat_${conversationId}`).emit('messages-read', {
			conversationId,
			userId,
			readAt: new Date()
		});
	} catch (err) {
		// Ignore socket errors
	}

	return conversation;
};

/**
 * Find or create conversation for an order between creator and another participant
 */
exports.getOrCreateOrderConversation = async (orderId, creatorId, otherParticipantId) => {
    return await this.createConversation(orderId, [creatorId, otherParticipantId]);
};


/**
 * Get conversation for an order (where the current user is a participant)
 */
exports.getConversationByOrder = async (orderId, user, otherParticipantId = null) => {
    const userId = user._id;
    const isSuperAdmin = user.role === 'SUPER_ADMIN';

    let query;
    if (isSuperAdmin && otherParticipantId) {
        // Super Admin can see any conversation by specifying the other participant
        query = { orderId, participants: otherParticipantId };
    } else if (otherParticipantId) {
        query = { orderId, participants: { $all: [userId, otherParticipantId] } };
    } else {
        query = { orderId, participants: userId };
    }

    return await Conversation.findOne(query)
        .populate('orderId', 'orderNumber title status')
        .populate('participants', 'fullName photo role');
};
