const asyncHandler = require('../utils/asyncHandler');
const notifications = require('../models/notificationModel');
const { toNotification } = require('../utils/format');

const respond = async (req, res) =>
  res.json({ notifications: (await notifications.list(req.user.id)).map(toNotification) });

exports.list = asyncHandler(respond);
exports.read = asyncHandler(async (req, res) => { await notifications.markRead(req.user.id, req.params.id); await respond(req, res); });
exports.readAll = asyncHandler(async (req, res) => { await notifications.markAllRead(req.user.id); await respond(req, res); });
