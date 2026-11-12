// End-to-end API check. Start the server first (npm start), then:  npm run smoke
// Uses only the demo accounts created by `npm run db:seed` (plus one throw-away doctor).
const BASE = process.env.BASE_URL || 'http://localhost:4000/api';

let passed = 0;
let failed = 0;

async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  return { status: res.status, data };
}

function check(name, condition, extra = '') {
  if (condition) { passed++; console.log(`  ✔ ${name}`); }
  else { failed++; console.log(`  ✖ ${name} ${extra}`); }
}

const login = async (email, password, role) => (await call('/auth/login', { method: 'POST', body: { email, password, role } }));

(async () => {
  console.log('\nAuth');
  const health = await call('/health');
  check('health endpoint', health.status === 200);
  const bad = await login('alice@gmail.com', 'wrong-password', 'student');
  check('wrong password rejected (401)', bad.status === 401);
  const alice = await login('alice@gmail.com', 'pass123', 'student');
  check('student login', alice.status === 200 && alice.data.token);
  const drGreen = await login('dr.green@gmail.com', 'doc123', 'doctor');
  check('doctor login', drGreen.status === 200 && drGreen.data.token);
  const admin = await login('admin@mindbridge.com', 'admin123', 'admin');
  check('admin login', admin.status === 200 && admin.data.token);
  const noToken = await call('/mood');
  check('protected route needs a token (401)', noToken.status === 401);

  const A = alice.data.token, D = drGreen.data.token, M = admin.data.token;

  console.log('\nRole protection');
  check('student cannot open admin API (403)', (await call('/admin/overview', { token: A })).status === 403);
  check('student cannot open doctor API (403)', (await call('/doctor/caseload', { token: A })).status === 403);
  check('doctor cannot save moods (403)', (await call('/mood', { method: 'POST', token: D, body: { score: 50 } })).status === 403);

  console.log('\nDoctor sign-up and verification gate');
  const email = `dr.test${Date.now()}@gmail.com`;
  const signup = await call('/auth/signup', { method: 'POST', body: {
    name: 'Dr. Test', email, password: 'testing123', role: 'doctor',
    licenseNumber: 'TEST-1', licenseAuthority: 'Test Council', specialization: 'Counselling'
  } });
  check('doctor can register', signup.status === 201);
  check('unverified doctor cannot sign in (403)', (await login(email, 'testing123', 'doctor')).status === 403);
  const pending = await call('/admin/doctors?status=pending', { token: M });
  const newDoc = (pending.data.doctors || []).find(d => d.email === email);
  check('admin sees the pending doctor', !!newDoc);
  check('admin approves the doctor', (await call(`/admin/doctors/${newDoc.id}/approve`, { method: 'POST', token: M, body: { notes: 'ok' } })).status === 200);
  check('approved doctor can now sign in', (await login(email, 'testing123', 'doctor')).status === 200);

  console.log('\nMood');
  const mood = await call('/mood', { method: 'POST', token: A, body: { score: 72, tags: ['calm', 'hopeful'], note: 'smoke test' } });
  check('save a mood check-in', mood.status === 201 && mood.data.label, JSON.stringify(mood.data));
  check('reject score > 100', (await call('/mood', { method: 'POST', token: A, body: { score: 500 } })).status === 400);
  const moodList = await call('/mood?days=30', { token: A });
  check('list mood history', moodList.status === 200 && moodList.data.history.length > 0);

  console.log('\nCheck-in (assessment)');
  const qs = await call('/assessments/questions');
  check('questions available', qs.data.questions.length === 8 && qs.data.options.length === 4);
  check('incomplete answers rejected', (await call('/assessments', { method: 'POST', token: A, body: { answers: { 0: 1 } } })).status === 400);
  const answers = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [i, 3]));
  const scored = await call('/assessments', { method: 'POST', token: A, body: { answers } });
  check('max answers => total 24, severe, 100%', scored.data.total === 24 && scored.data.severity === 'severe' && scored.data.percent === 100, JSON.stringify(scored.data));
  const mild = await call('/assessments', { method: 'POST', token: A, body: { answers: Object.fromEntries(Array.from({ length: 8 }, (_, i) => [i, 0])) } });
  check('zero answers => mild', mild.data.severity === 'mild');
  check('assessment history', (await call('/assessments', { token: A })).data.assessments.length >= 2);

  console.log('\nReminders');
  const added = await call('/reminders', { method: 'POST', token: A, body: { text: 'Smoke-test reminder' } });
  const item = added.data.reminders.find(r => r.text === 'Smoke-test reminder');
  check('add reminder', added.status === 201 && item);
  const toggled = await call(`/reminders/${item.id}`, { method: 'PATCH', token: A, body: { done: true } });
  check('mark reminder done', toggled.data.reminders.find(r => r.id === item.id).done === true);
  const removed = await call(`/reminders/${item.id}`, { method: 'DELETE', token: A });
  check('delete reminder', !removed.data.reminders.some(r => r.id === item.id));

  console.log('\nChat companion');
  const chat = await call('/chat', { method: 'POST', token: A, body: { message: 'I feel anxious about exams' } });
  check('companion replies', chat.status === 200 && JSON.stringify(chat.data).length > 20, JSON.stringify(chat.data));
  const crisis = await call('/chat', { method: 'POST', token: A, body: { message: 'I want to end my life' } });
  check('crisis message adds a safety reply', JSON.stringify(crisis.data).includes('iCall') || JSON.stringify(crisis.data).toLowerCase().includes('crisis'), JSON.stringify(crisis.data));
  check('chat history', (await call('/chat', { token: A })).data.messages.length >= 4);
  check('tips', (await call('/tips', { token: A })).data.tips.length === 3);

  console.log('\nAppointments');
  const docs = await call('/auth/doctors', { token: A });
  const green = docs.data.doctors.find(d => d.email === 'dr.green@gmail.com');
  check('student sees verified doctors only', !!green && !docs.data.doctors.some(d => d.email === 'nobody@x.com'));
  const date = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const slotsBefore = await call(`/appointments/slots?doctorId=${green.id}&date=${date}`, { token: A });
  check('16 slots offered', slotsBefore.data.slots.length === 16);
  const time = slotsBefore.data.slots.find(s => !s.taken).time;
  const booked = await call('/appointments', { method: 'POST', token: A, body: { doctorId: green.id, date, time, reason: 'smoke test' } });
  check('book appointment', booked.status === 201, JSON.stringify(booked.data));
  const dup = await call('/appointments', { method: 'POST', token: A, body: { doctorId: green.id, date, time } });
  check('same slot cannot be double-booked (409)', dup.status === 409);
  check('past dates rejected', (await call('/appointments', { method: 'POST', token: A, body: { doctorId: green.id, date: '2020-01-01', time } })).status === 400);
  const inbox = await call('/appointments/inbox', { token: D });
  const appt = inbox.data.appointments.find(a => a.date === date && a.time === time);
  check('doctor receives the request', !!appt);
  check('doctor accepts', (await call(`/appointments/${appt.id}/accept`, { method: 'PATCH', token: D })).status === 200);
  check('student sees accepted status', (await call('/appointments/mine', { token: A })).data.appointments.find(a => a.id === appt.id).status === 'accepted');

  console.log('\nDoctor tools');
  const caseload = await call('/doctor/caseload', { token: D });
  const student = caseload.data.students.find(s => s.email === 'alice@gmail.com');
  check('caseload includes students with an appointment', !!student);
  check('student detail drawer data', (await call(`/doctor/students/${student.id}`, { token: D })).data.mood.length > 0);
  const bob = (await call('/doctor/caseload', { token: D })).data.students.find(s => s.email === 'bob@gmail.com');
  if (!bob) {
    const bobLogin = await login('bob@gmail.com', 'pass123', 'student');
    const bobId = bobLogin.data.user.id;
    check('doctor cannot read a student outside the caseload (403)', (await call(`/doctor/students/${bobId}`, { token: D })).status === 403);
  }
  check('send recommendation', (await call('/doctor/recommendations', { method: 'POST', token: D, body: { studentId: student.id, recommendation: 'Try a short walk daily.' } })).status === 201);

  console.log('\nNotifications');
  const notes = await call('/notifications', { token: A });
  check('student received notifications', notes.data.notifications.length > 0);
  check('mark all read', (await call('/notifications/read-all', { method: 'PATCH', token: A })).data.notifications.every(n => n.read));

  console.log('\nAdmin');
  const overview = await call('/admin/overview', { token: M });
  check('overview stats', overview.status === 200 && overview.data.users);
  check('user list', (await call('/admin/users', { token: M })).data.users.length >= 5);
  check('NPI number validation', (await call('/admin/npi-lookup', { method: 'POST', token: M, body: { npiNumber: '123' } })).status === 400);

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
})().catch(err => { console.error(err); process.exit(1); });
