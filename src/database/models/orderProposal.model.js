const mongoose = require('mongoose');

const orderProposalSchema = new mongoose.Schema(
	{
		orderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Order',
			required: true,
			index: true,
		},
		submittedByUserId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		companyId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Company',
			default: null,
			index: true,
		},
		proposalType: {
			type: String,
			enum: ['COMPANY', 'PRIVATE_TRANSPORTER'],
			required: true,
			index: true,
		},
		proposedPrice: {
			type: Number,
			required: true,
			min: 0,
		},
		currency: {
			type: String,
			trim: true,
			uppercase: true,
			default: 'ETB',
		},
		message: {
			type: String,
			trim: true,
			default: null,
			maxlength: 1000,
		},
		estimatedPickupDate: {
			type: Date,
			default: null,
		},
		vehicleDetails: {
			type: String,
			trim: true,
			default: null,
			maxlength: 500,
		},
		status: {
			type: String,
			enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
			default: 'PENDING',
			index: true,
		},
		reviewedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			default: null,
		},
		reviewedAt: {
			type: Date,
			default: null,
		},
		acceptedAt: {
			type: Date,
			default: null,
		},
		rejectionReason: {
			type: String,
			trim: true,
			default: null,
			maxlength: 1000,
		},
	},
	{ timestamps: true }
);

orderProposalSchema.index({ orderId: 1, status: 1, createdAt: -1 });
orderProposalSchema.index({ orderId: 1, proposalType: 1, companyId: 1 });
orderProposalSchema.index({ orderId: 1, proposalType: 1, submittedByUserId: 1 });

module.exports = mongoose.model('OrderProposal', orderProposalSchema);
