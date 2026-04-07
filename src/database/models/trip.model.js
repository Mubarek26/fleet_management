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

// Main Trip schema
const tripSchema = new mongoose.Schema({
  // ✅ Current location (indexed)
  location: {
    type: geoPointSchema,
    required: true
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
  }

}, { timestamps: true });


// ✅ ONLY THIS INDEX (important)
tripSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Trip', tripSchema);