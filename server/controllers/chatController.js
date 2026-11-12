const asyncHandler = require('../utils/asyncHandler');
const chats = require('../models/chatModel');
const chat = require('../services/chatService');
const { toChat } = require('../utils/format');
const { badRequest } = require('../utils/httpError');

exports.history = asyncHandler(async (req, res) =>
  res.json({ messages: (await chats.recent(req.user.id)).map(toChat) }));

exports.send = asyncHandler(async (req, res) => {
  const text = String((req.body || {}).message || '').trim();
  if (!text) throw badRequest('Type a message first.');
  if (text.length > 1000) throw badRequest('Please keep messages under 1000 characters.');
  res.json(await chat.sendMessage(req.user.id, text));
});

exports.clear = asyncHandler(async (req, res) => {
  await chats.clear(req.user.id);
  res.json({ ok: true });
});
