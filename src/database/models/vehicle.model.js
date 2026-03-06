const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
	{
		companyId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Company",
			required: true,
			index: true,
		},
		plateNumber: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			uppercase: true,
		},
		vehicleType: {
			type: String,
			required: true,
			trim: true,
		},
		model: {
			type: String,
			trim: true,
			default: null,
		},
		capacityKg: {
			type: Number,
			default: 0,
			min: 0,
		},
		status: {
			type: String,
			enum: ["ACTIVE", "INACTIVE", "MAINTENANCE"],
			default: "ACTIVE",
		},
		active: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
