// Fills the database with demo accounts and a few weeks of realistic data.
// Safe to run twice: it stops if users already exist (use `npm run db:reset` to start over).
const bcrypt = require('bcryptjs');
const { pool, query, one } = require('../server/config/db');
const users = require('../server/models/userModel');
const doctors = require('../server/models/doctorModel');
const reminders = require('../server/models/reminderModel');
const { scoreAnswers } = require('../server/utils/scoring');

const daysAgo = (n, hour = 20) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
};
const dateStr = offset => { const d = new Date(); d.setUTCDate(d.getUTCDate() + offset); return d.toISOString().slice(0, 10); };

async function makeUser(name, email, role, password) {
  return users.create({ name, email, role, passwordHash: await bcrypt.hash(password, 10) });
}

async function addDoctor(name, email, spec, authority, license, status, notes = '') {
  const id = await makeUser(name, email, 'doctor', 'doc12345');
  await doctors.createProfile({ userId: id, licenseNumber: license, licenseAuthority: authority, specialization: spec });
  if (status !== 'pending') {
    await query(`UPDATE doctor_profiles SET verification_status=?, verification_notes=?, verified_at=UTC_TIMESTAMP() WHERE user_id=?`, [status, notes, id]);
  }
  return id;
}

async function addMoods(userId, scores) {
  const tagSets = [['calm'], ['tired', 'stressed'], ['hopeful'], ['anxious'], ['grateful', 'calm'], ['lonely'], ['focused'], ['tired']];
  for (let i = 0; i < scores.length; i++) {
    const when = daysAgo(scores.length - 1 - i);
    await query('INSERT INTO mood_entries (user_id, score, tags, note, created_at) VALUES (?,?,?,?,?)',
      [userId, scores[i], tagSets[i % tagSets.length].join(','), null, when]);
  }
}

async function addAssessment(userId, answers, daysBack) {
  const r = scoreAnswers(answers);
  await query(
    'INSERT INTO assessments (user_id, phq_score, gad_score, total_score, severity, created_at) VALUES (?,?,?,?,?,?)',
    [userId, r.phq, r.gad, r.total, r.severity, daysAgo(daysBack)]);
}

(async () => {
  if (await one('SELECT id FROM users LIMIT 1')) {
    console.log('Users already exist — skipping seed. (Use `npm run db:reset` to start fresh.)');
    return;
  }

  const admin = await makeUser('Admin', 'admin@mindbridge.com', 'admin', 'admin123');
  const alice = await makeUser('Alice Johnson', 'alice@gmail.com', 'student', 'pass123');
  const bob = await makeUser('Bob Smith', 'bob@gmail.com', 'student', 'pass123');
  const mei = await makeUser('Mei Tanaka', 'mei@gmail.com', 'student', 'pass123');

  const green = await addDoctor('Dr. Green', 'dr.green@gmail.com', 'Psychiatry', 'Demo Medical Council', 'MD-DEMO-0001', 'approved', 'Seeded demo account.');
  await query(`UPDATE users SET password_hash=? WHERE id=?`, [await bcrypt.hash('doc123', 10), green]); // matches the original README
  const patel = await addDoctor('Dr. Anika Patel', 'dr.patel@gmail.com', 'Clinical Psychology', 'National Medical Commission', 'NMC-44821', 'approved', 'Seeded demo account.');
  await addDoctor('Dr. Lucas Meyer', 'dr.meyer@gmail.com', 'Counselling', 'State Medical Board', 'SMB-90315', 'pending');

  for (const s of [alice, bob, mei]) await reminders.seedDefaults(s);

  // 6 weeks of Alice's moods, trending up with some dips.
  await addMoods(alice, [48,52,40,35,58,62,66,45,38,55,60,72,64,50,42,58,66,70,74,61,52,68,76,80,70,62,45,38,55,72,78,84,66,58,64,70,38,62,80,55,45,66,72,82]);
  await addMoods(bob, [30,34,28,40,25,32,22,36,30,26,33,20,28,35]);
  await addMoods(mei, [58,60,64,62,70,66,72,68,74,70]);

  await addAssessment(alice, [1,1,1,1,1,0,1,1], 20);
  await addAssessment(alice, [1,1,2,1,1,1,1,1], 4);
  await addAssessment(bob, [2,3,3,2,2,3,2,3], 3);
  await addAssessment(mei, [0,1,0,1,1,0,1,0], 5);

  // Appointments, so the doctor dashboards have a caseload.
  const mk = async (student, doctor, offset, time, reason, status) => query(
    `INSERT INTO appointments (id, student_id, doctor_id, appt_date, appt_time, reason, status) VALUES (?,?,?,?,?,?,?)`,
    [users.newId(), student, doctor, dateStr(offset), time, reason, status]);
  await mk(bob, green, 1, '10:00', 'Struggling to sleep and focus before exams.', 'requested');
  await mk(alice, green, 3, '14:30', 'Would like to talk about managing stress.', 'accepted');
  await mk(mei, green, 5, '11:30', 'General check-in.', 'pending');
  await mk(alice, patel, 7, '09:30', 'Follow-up on anxiety.', 'requested');

  const note = (u, title, msg) => query('INSERT INTO notifications (id,user_id,title,message) VALUES (?,?,?,?)', [users.newId(), u, title, msg]);
  await note(alice, 'Welcome to MindBridge', 'Log a mood, try a breathing round, and watch your garden grow.');
  await note(alice, 'Appointment accepted', 'Dr. Green accepted your appointment.');
  await note(green, 'New appointment request', 'Bob Smith asked for tomorrow at 10:00.');
  await note(admin, 'New doctor verification request', `Dr. Lucas Meyer (State Medical Board) is waiting for review.`);

  console.log('Seeded demo data.\n');
  console.log('  Student  alice@gmail.com        pass123');
  console.log('  Student  bob@gmail.com          pass123');
  console.log('  Doctor   dr.green@gmail.com     doc123');
  console.log('  Doctor   dr.patel@gmail.com     doc12345');
  console.log('  Admin    admin@mindbridge.com   admin123\n');
})().catch(e => { console.error('Seed failed:', e.message); process.exitCode = 1; })
  .finally(() => pool.end());
