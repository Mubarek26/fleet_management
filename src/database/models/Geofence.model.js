const mongoose = require('mongoose');

const geofenceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['start', 'destination', 'corridor', 'restricted'], required: true },
  geometry: {
    type: { type: String, enum: ['Polygon', 'Point', 'LineString'], required: true },
    coordinates: { type: Array, required: true },
  },
  radius: Number, 
  buffer: Number, 
});

// CHECK: Use existing model if it exists, otherwise create it
module.exports = mongoose.models.Geofence || mongoose.model('Geofence', geofenceSchema);