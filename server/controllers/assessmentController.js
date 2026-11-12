const asyncHandler = require('../utils/asyncHandler');
const assessments = require('../models/assessmentModel');
const { QUESTIONS, OPTIONS, scoreAnswers } = require('../utils/scoring');
const { toAssessment } = require('../utils/format');
const { badRequest } = require('../utils/httpError');

exports.questions = (req, res) => res.json({ questions: QUESTIONS, options: OPTIONS });

// POST /api/assessments { answers: { "0": 1, ... "7": 3 } }
exports.submit = asyncHandler(async (req, res) => {
  const result = scoreAnswers((req.body || {}).answers || {});
  if (!result) throw badRequest('Please answer every question.');
  await assessments.add({ userId: req.user.id, ...result });
  res.status(201).json(result);
});

exports.history = asyncHandler(async (req, res) => {
  const rows = await assessments.history(req.user.id);
  res.json({ assessments: rows.map(toAssessment) });
});
