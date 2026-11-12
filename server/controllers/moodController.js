const asyncHandler = require('../utils/asyncHandler');
const mood = require('../models/moodModel');
const { moodBand } = require('../utils/scoring');
const { toMood } = require('../utils/format');
const { badRequest } = require('../utils/httpError');

// GET /api/mood?days=60
exports.list = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
  const [rows, total] = await Promise.all([mood.recent(req.user.id, days), mood.total(req.user.id)]);
  res.json({ history: rows.map(toMood), totalCheckins: total });
});

// POST /api/mood { score, tags?, note? }
exports.create = asyncHandler(async (req, res) => {
  const { score, tags = [], note = '' } = req.body || {};
  const n = Number(score);
  if (!Number.isFinite(n) || n < 0 || n > 100) throw badRequest('Mood score must be between 0 and 100.');
  if (!Array.isArray(tags) || tags.length > 6) throw badRequest('Pick up to 6 feelings.');

  const cleanTags = tags.map(t => String(t).toLowerCase().replace(/[^a-z ]/g, '').trim().slice(0, 20)).filter(Boolean);
  await mood.add({ userId: req.user.id, score: Math.round(n), tags: cleanTags, note: String(note).trim().slice(0, 500) });

  const band = moodBand(Math.round(n));
  res.status(201).json({ label: band.label, message: band.message, totalCheckins: await mood.total(req.user.id) });
});
