const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['IDLE_ALERT', 'TRIP_START', 'TRIP_END', 'SYSTEM'],
    default: 'SYSTEM'
  },
  metadata: {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    idleEventId: { type: mongoose.Schema.Types.ObjectId, ref: 'IdleEvent' }
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
