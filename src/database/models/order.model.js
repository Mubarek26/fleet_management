const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
	{
		address: {
			type: String,
			required: true,
			trim: true,
		},
		city: {
			type: String,
			trim: true,
			default: null,
		},
		state: {
			type: String,
			trim: true,
			default: null,
		},
		country: {
			type: String,
			trim: true,
			default: null,
		},
		latitude: {
			type: Number,
			default: null,
			min: -90,
			max: 90,
		},
		longitude: {
			type: Number,
			default: null,
			min: -180,
			max: 180,
		},
		contactName: {
			type: String,
			trim: true,
			default: null,
		},
		contactPhone: {
			type: String,
			trim: true,
			default: null,
		},
	},
	{ _id: false }
);


const cargoSchema = new mongoose.Schema(
	{
		type: {
			type: String,
			trim: true,
			default: null,
		},
		description: {
			type: String,
			trim: true,
			default: null,
		},
		weightKg: {
			type: Number,
			min: 0,
			default: null,
		},
		quantity: {
			type: Number,
			min: 1,
			default: 1,
		},
		unit: {
			type: String,
			enum: ['ITEM', 'BOX', 'PALLET', 'TON'],
			default: 'ITEM',
		},
		specialHandling: {
			type: [String],
			default: [],
		},
	},
	{ _id: false }
);

const vehicleRequirementsSchema = new mongoose.Schema(
	{
		vehicleType: {
			type: String,
			trim: true,
			default: null,
		},
		minimumCapacityKg: {
			type: Number,
			min: 0,
			default: null,
		},
	},
	{ _id: false }
);

const pricingSchema = new mongoose.Schema(
	{
		proposedBudget: {
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
		paymentMethod: {
			type: String,
			enum: ['CASH', 'BANK_TRANSFER', 'WALLET', 'CARD'],
			default: 'BANK_TRANSFER',
		},
		negotiable: {
			type: Boolean,
			default: true,
		},
	},
	{ _id: false }
);

const orderSchema = new mongoose.Schema(
	{
		orderNumber: {
			type: String,
			unique: true,
			index: true,
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		assignmentMode: {
			type: String,
			enum: ['DIRECT_COMPANY', 'DIRECT_PRIVATE_TRANSPORTER', 'OPEN_MARKETPLACE'],
			default: 'OPEN_MARKETPLACE',
			index: true,
		},
		targetCompanyId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Company',
			default: null,
			index: true,
		},
		targetTransporterId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			default: null,
			index: true,
		},
		assignedVehicleId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Vehicle',
			default: null,
			index: true,
		},
		channel: {
			type: String,
			enum: ['MARKETPLACE', 'DIRECT'],
			default: 'MARKETPLACE',
		},
		status: {
			type: String,
			enum: ['PENDING','REJECTED','OPEN', 'MATCHED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
			default: 'PENDING',
        },
        postStatus: {
            type: String,
            enum: ['ACTIVE', 'EXPIRED', 'CANCELLED', 'COMPLETED', 'ARCHIVED', 'DELETED'],
            default: 'ACTIVE',
        },
		title: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
			default: null,
		},
		pickupLocation: {
			type: locationSchema,
			required: true,
		},
		deliveryLocation: {
			type: locationSchema,
			required: true,
		},
		cargo: {
			type: cargoSchema,
			default: () => ({}),
		},
		vehicleRequirements: {
			type: vehicleRequirementsSchema,
			default: () => ({}),
		},
		pickupDate: {
			type: Date,
			required: true,
		},
		deliveryDeadline: {
			type: Date,
			default: null,
		},
		pricing: {
			type: pricingSchema,
			required: true,
		},
		specialInstructions: {
			type: String,
			trim: true,
			default: null,
		},
	},
	{ timestamps: true }
);

orderSchema.pre('validate', function (next) {
	if (this.assignmentMode === 'DIRECT_COMPANY') {
		if (!this.targetCompanyId) {
			return next(new Error('targetCompanyId is required when assignmentMode is DIRECT_COMPANY'));
		}

		this.targetTransporterId = null;
	}

	if (this.assignmentMode === 'DIRECT_PRIVATE_TRANSPORTER') {
		if (!this.targetTransporterId) {
			return next(new Error('targetTransporterId is required when assignmentMode is DIRECT_PRIVATE_TRANSPORTER'));
		}

		this.targetCompanyId = null;
	}

	if (this.assignmentMode === 'OPEN_MARKETPLACE') {
		this.targetCompanyId = null;
		this.targetTransporterId = null;
	}

	next();
});

orderSchema.pre('save', function (next) {
	if (!this.orderNumber) {
		const random = Math.random().toString(36).slice(2, 8).toUpperCase();
		this.orderNumber = `ORD-${Date.now()}-${random}`;
	}

	next();
});

module.exports = mongoose.model('Order', orderSchema);
