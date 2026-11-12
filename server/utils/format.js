// Small helpers that turn database rows into the JSON shapes the frontend expects.
const iso = d => (d instanceof Date ? d.toISOString() : d);

const toUser = u => ({ id: u.id, name: u.name, email: u.email, role: u.role });

const toMood = m => ({
  id: m.id,
  score: m.score,
  tags: m.tags ? m.tags.split(',').filter(Boolean) : [],
  note: m.note || '',
  date: iso(m.created_at)
});

const toAssessment = a => ({
  id: a.id,
  phq: a.phq_score,
  gad: a.gad_score,
  total: a.total_score,
  severity: a.severity,
  date: iso(a.created_at)
});

const toReminder = r => ({ id: r.id, text: r.text, done: !!r.done });

const toChat = c => ({
  id: c.id,
  sender: c.sender,
  text: c.body,
  sentiment: c.sentiment || undefined,
  crisis: !!c.is_crisis,
  date: iso(c.created_at)
});

const toNotification = n => ({
  id: n.id, title: n.title, message: n.message, read: !!n.is_read, createdAt: iso(n.created_at)
});

const toAppointment = a => ({
  id: a.id,
  studentId: a.student_id,
  studentName: a.student_name,
  doctorId: a.doctor_id,
  doctorName: a.doctor_name,
  date: a.appt_date,
  time: a.appt_time,
  reason: a.reason,
  status: a.status,
  createdAt: iso(a.created_at)
});

module.exports = { toUser, toMood, toAssessment, toReminder, toChat, toNotification, toAppointment };
