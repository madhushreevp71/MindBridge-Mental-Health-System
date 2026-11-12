const asyncHandler = require('../utils/asyncHandler');
const reminders = require('../models/reminderModel');
const { toReminder } = require('../utils/format');
const { badRequest, notFound } = require('../utils/httpError');

const respond = async (req, res, status = 200) =>
  res.status(status).json({ reminders: (await reminders.list(req.user.id)).map(toReminder) });

exports.list = asyncHandler((req, res) => respond(req, res));

exports.create = asyncHandler(async (req, res) => {
  const text = String((req.body || {}).text || '').trim();
  if (!text) throw badRequest('Please type a reminder first.');
  await reminders.add(req.user.id, text.slice(0, 200));
  await respond(req, res, 201);
});

exports.update = asyncHandler(async (req, res) => {
  const item = await reminders.find(req.user.id, req.params.id);
  if (!item) throw notFound('Reminder not found.');
  const { done } = req.body || {};
  await reminders.setDone(item.id, typeof done === 'boolean' ? done : !item.done);
  await respond(req, res);
});

exports.remove = asyncHandler(async (req, res) => {
  if (!(await reminders.find(req.user.id, req.params.id))) throw notFound('Reminder not found.');
  await reminders.remove(req.user.id, req.params.id);
  await respond(req, res);
});
