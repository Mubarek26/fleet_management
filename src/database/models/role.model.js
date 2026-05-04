const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
  immutable: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
