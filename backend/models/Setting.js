const mongoose = require('mongoose');

/** Key/value store for site settings and editable homepage sections. */
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    group: { type: String, default: 'general', index: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', settingSchema);
