const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    licenseNumber: {
      type: String,
      trim: true,
      default: null,
        },
    licensePhoto: {
      type: String,
      default: null,
        },
    driverPhoto: {
      type: String,
      default: null,
        },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "SUSPENDED","OFFLINE"],
      default: "ACTIVE",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Driver", driverSchema);
