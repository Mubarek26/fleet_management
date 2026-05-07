const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
	{
		conversationId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Conversation',
			required: true,
			index: true,
		},
		senderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		text: {
			type: String,
			required: true,
		},
		type: {
			type: String,
			enum: ['TEXT', 'SYSTEM', 'PROPOSAL_UPDATE'],
			default: 'TEXT',
		},
		metadata: {
			type: Object,
			default: null,
		},
		readBy: [
			{
				userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
				readAt: { type: Date, default: Date.now },
			},
		],
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
