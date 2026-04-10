// smsLog.model.js
const mongoose = require('mongoose');

const smsLogSchema = new mongoose.Schema({
  receivedAt: { type: Date, default: Date.now },
  payload: { type: Object, required: true }
});

module.exports = mongoose.model('SmsLog', smsLogSchema);