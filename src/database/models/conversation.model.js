const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
	{
		orderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Order',
			required: true,
		},
		participants: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
				required: true,
			},
		],
		lastMessage: {
			text: String,
			senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			sentAt: Date,
		},
		unreadCount: {
			type: Map,
			of: Number,
			default: new Map(),
		},
		status: {
			type: String,
			enum: ['ACTIVE', 'ARCHIVED', 'CLOSED'],
			default: 'ACTIVE',
		},
	},
	{ timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ orderId: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
