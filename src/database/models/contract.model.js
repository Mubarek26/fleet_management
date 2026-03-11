const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema(
	{
		vendorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		transporterCompanyId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Company',
			required: true,
		},
		message: {
			type: String,
			trim: true,
			maxlength: 1000,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        commissionRate: {
            type: Number,
            min: 0,
        },
		status: {
			type: String,
			enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'TERMINATED'],
			default: 'PENDING',
		},
	},
	{ timestamps: true }
);

contractSchema.index({ vendorId: 1, transporterCompanyId: 1, status: 1 });

module.exports = mongoose.model('Contract', contractSchema);
