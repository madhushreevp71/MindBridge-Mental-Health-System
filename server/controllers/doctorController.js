const asyncHandler = require('../utils/asyncHandler');
const appts = require('../models/appointmentModel');
const assessments = require('../models/assessmentModel');
const moods = require('../models/moodModel');
const users = require('../models/userModel');
const notifications = require('../models/notificationModel');
const { toAssessment, toMood } = require('../utils/format');
const { badRequest, forbidden } = require('../utils/httpError');

// A doctor only sees students who have an active appointment with them.
// (The first version showed every student to every doctor, which is a privacy problem.)

// GET /api/doctor/caseload
exports.caseload = asyncHandler(async (req, res) => {
  const ids = await appts.studentIdsForDoctor(req.user.id);
  const students = await Promise.all(ids.map(async id => {
    const [user, latest, mood] = await Promise.all([users.findById(id), assessments.latest(id), moods.recent(id, 14)]);
    const scores = mood.map(m => m.score);
    return {
      id, name: user.name, email: user.email,
      latest: latest ? toAssessment(latest) : null,
      moodTrend: scores.slice(-7),
      moodAverage: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
    };
  }));
  const order = { severe: 0, moderate: 1, mild: 2 };
  students.sort((a, b) => (order[a.latest?.severity] ?? 3) - (order[b.latest?.severity] ?? 3));
  res.json({
    students,
    stats: {
      total: students.length,
      severe: students.filter(s => s.latest?.severity === 'severe').length,
      moderate: students.filter(s => s.latest?.severity === 'moderate').length
    }
  });
});

// GET /api/doctor/students/:id -> detail for the side drawer
exports.studentDetail = asyncHandler(async (req, res) => {
  if (!(await appts.hasRelationship(req.user.id, req.params.id))) throw forbidden('This student is not on your caseload.');
  const [user, mood, assessmentRows] = await Promise.all([
    users.findById(req.params.id), moods.recent(req.params.id, 30), assessments.history(req.params.id, 6)
  ]);
  res.json({
    student: { id: user.id, name: user.name, email: user.email },
    mood: mood.map(toMood),
    assessments: assessmentRows.map(toAssessment)
  });
});

// POST /api/doctor/recommendations { studentId, recommendation }
exports.recommend = asyncHandler(async (req, res) => {
  const { studentId, recommendation } = req.body || {};
  const text = String(recommendation || '').trim();
  if (!studentId || !text) throw badRequest('Choose a student and write a recommendation.');
  if (!(await appts.hasRelationship(req.user.id, studentId))) throw forbidden('This student is not on your caseload.');
  await notifications.add(studentId, `A note from ${req.user.name}`, text);
  res.status(201).json({ message: 'Recommendation sent.' });
});
