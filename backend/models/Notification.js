const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    isBroadcast: { type: Boolean, default: false, index: true },
    title: { type: String, required: true, maxlength: 140 },
    message: { type: String, required: true, maxlength: 1000 },
    type: { type: String, enum: ['info', 'success', 'warning', 'security'], default: 'info' },
    link: { type: String, default: '' },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
