const mongoose = require('mongoose');

// Milestone history schema
const milestoneHistorySchema = new mongoose.Schema({
  milestone: { type: String, required: true },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  note: { type: String },
  at: { type: Date, default: Date.now }
}, { _id: false });

// Reusable GeoJSON Point schema
const geoPointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
    required: true
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
    validate: {
      validator: function (val) {
        return val.length === 2;
      },
      message: 'Coordinates must be [longitude, latitude]'
    }
  }
}, { _id: false });

// Proof of Delivery evidence schema
const evidenceSchema = new mongoose.Schema({
  type: { type: String, enum: ['photo', 'signature', 'note'], required: true },
  url: String, // for photo/signature
  note: String,
  at: { type: Date, default: Date.now }
}, { _id: false });

// Main Trip schema
const tripSchema = new mongoose.Schema({
  // ✅ Current location (indexed)
  location: {
    type: geoPointSchema,
    // required: true
  },

  // ✅ History (NOT indexed)
  locationHistory: {
    type: [geoPointSchema],
    default: []
  },

  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },

  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },

  milestone: {
    type: String,
    enum: ['STARTED', 'ARRIVED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'],
    default: 'STARTED'
  },

  lastLocation: {
    lat: { type: Number },
    lng: { type: Number },
    speed: { type: Number },
    heading: { type: Number }
  },

  lastNote: { type: String },

  milestoneHistory: {
    type: [milestoneHistorySchema],
    default: []
  },

  active: {
    type: Boolean,
    default: true
  },

  // Proof of Delivery evidence
  proofOfDelivery: {
    type: [evidenceSchema],
    default: []
  },

  // OTP for delivery verification
  deliveryOtp: {
    code: { type: String },
    expiresAt: { type: Date },
    verified: { type: Boolean, default: false }
  },

  // Reference to the driver's wallet transaction for this trip (if paid)
  driverWalletTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  }

}, { timestamps: true });


// ✅ ONLY THIS INDEX (important)
tripSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Trip', tripSchema);