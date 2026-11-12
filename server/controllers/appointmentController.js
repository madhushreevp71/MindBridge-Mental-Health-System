const asyncHandler = require('../utils/asyncHandler');
const appts = require('../models/appointmentModel');
const users = require('../models/userModel');
const notifications = require('../models/notificationModel');
const { toAppointment } = require('../utils/format');
const { badRequest, notFound, conflict } = require('../utils/httpError');

// Half-hour slots, 09:00 - 16:30.
const SLOTS = Array.from({ length: 16 }, (_, i) => {
  const mins = 9 * 60 + i * 30;
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
});
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const todayStr = () => new Date().toISOString().slice(0, 10);

exports.studentList = asyncHandler(async (req, res) =>
  res.json({ appointments: (await appts.forStudent(req.user.id)).map(toAppointment) }));

exports.doctorList = asyncHandler(async (req, res) =>
  res.json({ appointments: (await appts.forDoctor(req.user.id)).map(toAppointment) }));

// GET /api/appointments/slots?doctorId=..&date=YYYY-MM-DD
exports.slots = asyncHandler(async (req, res) => {
  const { doctorId, date } = req.query;
  if (!doctorId || !DATE_RE.test(date || '')) throw badRequest('Choose a doctor and a date.');
  const taken = new Set(await appts.takenTimes(doctorId, date));
  res.json({ slots: SLOTS.map(time => ({ time, taken: taken.has(time) })) });
});

// POST /api/appointments { doctorId, date, time, reason }
exports.create = asyncHandler(async (req, res) => {
  const { doctorId, date, time, reason = '' } = req.body || {};
  if (!doctorId || !DATE_RE.test(date || '')) throw badRequest('Please choose a doctor and a date.');
  if (date < todayStr()) throw badRequest('That date has already passed.');
  if (!SLOTS.includes(time)) throw badRequest('Please pick one of the available times.');

  const doctor = await users.findById(doctorId);
  if (!doctor || doctor.role !== 'doctor' || !doctor.is_active) throw notFound('That doctor could not be found.');
  if ((await appts.takenTimes(doctorId, date)).includes(time)) throw conflict('Someone just took that time. Please pick another.');

  const appt = await appts.create({
    studentId: req.user.id, doctorId, date, time, reason: String(reason).trim().slice(0, 500)
  });
  await notifications.add(doctorId, 'New appointment request',
    `${req.user.name} asked for ${date} at ${time}.`);
  res.status(201).json({ message: 'Request sent. Your doctor will reply soon.', appointment: toAppointment(appt) });
});

// PATCH /api/appointments/:id/cancel (student)
exports.cancel = asyncHandler(async (req, res) => {
  const appt = await appts.findById(req.params.id);
  if (!appt || appt.student_id !== req.user.id) throw notFound('Appointment not found.');
  await appts.setStatus(appt.id, 'cancelled');
  await notifications.add(appt.doctor_id, 'Appointment cancelled', `${req.user.name} cancelled ${appt.appt_date} ${appt.appt_time}.`);
  res.json({ message: 'Appointment cancelled.' });
});

// PATCH /api/appointments/:id/:action  (doctor)  action = accept | pending | reject
const DOCTOR_ACTIONS = {
  accept:  { status: 'accepted', verb: 'accepted' },
  pending: { status: 'pending',  verb: 'put on hold' },
  reject:  { status: 'rejected', verb: 'declined' }
};
exports.doctorAction = asyncHandler(async (req, res) => {
  const action = DOCTOR_ACTIONS[req.params.action];
  if (!action) throw notFound('Unknown action.');
  const appt = await appts.findById(req.params.id);
  if (!appt || appt.doctor_id !== req.user.id) throw notFound('Appointment not found.');
  await appts.setStatus(appt.id, action.status);
  await notifications.add(appt.student_id, `Appointment ${action.verb}`,
    `${req.user.name} ${action.verb} your appointment on ${appt.appt_date} at ${appt.appt_time}.`);
  res.json({ message: `Appointment ${action.verb}.` });
});
