const mongoose = require("mongoose");
const validator = require("validator");

const companySchema = new mongoose.Schema({

  companyName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email address']
  },
  website: {
    type: String,
    unique: true,
    lowercase: true
  },
  photo: String,
  description: String,

  numberOfCars: {
    type: Number,
    default: 0
  },
  

  businessLicense: {
    type: String,
    required: true
  },

  address: String,

  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  status: {
    type: String,
    enum: ["PENDING", "ACTIVE", "SUSPENDED"],
    default: "PENDING"
  },
  active: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Company", companySchema);