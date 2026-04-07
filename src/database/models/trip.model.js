const mongoose = require('mongoose');

const milestoneHistorySchema = new mongoose.Schema({
  milestone: { type: String, required: true },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  note: { type: String },
  at: { type: Date, default: Date.now }
}, { _id: false });

const tripSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: false
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
  milestoneHistory: [milestoneHistorySchema],
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
