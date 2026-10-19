const Notification = require('../models/Notification');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const { paginate } = require('../utils/queryFeatures');
const { broadcast } = require('../services/notification.service');
const { sendAnnouncementEmail } = require('../services/email.service');

const listMine = asyncHandler(async (req, res) => {
  const filter = { $or: [{ user: req.user._id }, { isBroadcast: true }] };
  const { items, meta } = await paginate(Notification, {
    filter,
    page: req.query.page,
    limit: req.query.limit,
    sort: '-createdAt',
  });
  const data = items.map((n) => ({
    ...n,
    isRead: n.isBroadcast ? (n.readBy || []).some((id) => String(id) === String(req.user._id)) : n.isRead,
  }));
  return sendSuccess(res, { message: 'Notifications', data, meta });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw ApiError.notFound('Notification not found');
  if (notification.isBroadcast) {
    await Notification.updateOne({ _id: notification._id }, { $addToSet: { readBy: req.user._id } });
  } else {
    if (String(notification.user) !== String(req.user._id)) throw ApiError.forbidden();
    notification.isRead = true;
    await notification.save();
  }
  return sendSuccess(res, { message: 'Notification read', data: null });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  await Notification.updateMany({ isBroadcast: true }, { $addToSet: { readBy: req.user._id } });
  return sendSuccess(res, { message: 'All notifications read', data: null });
});

const createBroadcast = asyncHandler(async (req, res) => {
  const { title, message, type, sendEmail } = req.body;
  const notification = await broadcast({ title, message, type });

  if (sendEmail) {
    const recipients = await User.find({ status: 'active', 'notificationPreferences.email': true })
      .select('email')
      .lean();
    await Promise.allSettled(recipients.map((u) => sendAnnouncementEmail(u.email, title, message)));
  }

  return sendSuccess(res, { statusCode: 201, message: 'Announcement sent', data: notification });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndDelete(req.params.id);
  if (!notification) throw ApiError.notFound('Notification not found');
  return sendSuccess(res, { message: 'Notification deleted', data: null });
});

module.exports = { listMine, markRead, markAllRead, createBroadcast, deleteNotification };
