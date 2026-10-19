const Notification = require('../models/Notification');

/** Creates a targeted notification for one user. */
const notifyUser = (userId, { title, message, type = 'info', link = '' }) =>
  Notification.create({ user: userId, title, message, type, link });

/** Creates a single broadcast notification visible to all users. */
const broadcast = ({ title, message, type = 'info', link = '' }) =>
  Notification.create({ isBroadcast: true, title, message, type, link });

module.exports = { notifyUser, broadcast };
