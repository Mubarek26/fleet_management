const mongoose = require('mongoose');

const geofenceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['start', 'destination', 'corridor', 'restricted'], required: true },
  geometry: {
    type: { type: String, enum: ['Polygon', 'Point', 'LineString'], required: true },
    coordinates: { type: Array, required: true },
  },
  radius: Number, // For circles (in meters), optional
  buffer: Number, // For corridors (in km), optional
});

module.exports = mongoose.model('Geofence', geofenceSchema);
