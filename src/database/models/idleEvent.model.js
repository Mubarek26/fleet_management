const mongoose = require('mongoose');

const idleEventSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  detectedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  },
  distanceMoved: {
    type: Number, // meters
    required: true
  },
  idleDurationMinutes: {
    type: Number,
    required: true
  },
  history: {
    type: [
      {
        coordinates: [Number],
        timestamp: Date
      }
    ],
    default: []
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: Date,
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('IdleEvent', idleEventSchema);
