const { query, one } = require('../config/db');
const { newId } = require('./userModel');

// Every read joins both names so the frontend never needs a second lookup.
const BASE = `
  SELECT a.*, s.name AS student_name, d.name AS doctor_name
  FROM appointments a
  JOIN users s ON s.id = a.student_id
  JOIN users d ON d.id = a.doctor_id`;

async function create({ studentId, doctorId, date, time, reason }) {
  const id = newId();
  await query(
    'INSERT INTO appointments (id, student_id, doctor_id, appt_date, appt_time, reason) VALUES (?,?,?,?,?,?)',
    [id, studentId, doctorId, date, time, reason]);
  return findById(id);
}

const findById = id => one(`${BASE} WHERE a.id = ?`, [id]);
const forStudent = id => query(`${BASE} WHERE a.student_id = ? ORDER BY a.appt_date DESC, a.appt_time DESC`, [id]);
const forDoctor = id => query(`${BASE} WHERE a.doctor_id = ? ORDER BY a.appt_date ASC, a.appt_time ASC`, [id]);

const setStatus = (id, status) => query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);

// Times already taken by a doctor on a day (cancelled / rejected slots are free again).
const takenTimes = async (doctorId, date) =>
  (await query(
    `SELECT appt_time FROM appointments
     WHERE doctor_id = ? AND appt_date = ? AND status IN ('requested','accepted','pending')`,
    [doctorId, date])).map(r => r.appt_time);

// Students a doctor has an active relationship with (used for the caseload).
const studentIdsForDoctor = async doctorId =>
  (await query(
    `SELECT DISTINCT student_id FROM appointments
     WHERE doctor_id = ? AND status IN ('requested','accepted','pending')`, [doctorId])).map(r => r.student_id);

const hasRelationship = async (doctorId, studentId) =>
  !!(await one(
    `SELECT 1 AS ok FROM appointments
     WHERE doctor_id = ? AND student_id = ? AND status IN ('requested','accepted','pending') LIMIT 1`,
    [doctorId, studentId]));

const countByStatus = () => query('SELECT status, COUNT(*) AS n FROM appointments GROUP BY status');

module.exports = {
  create, findById, forStudent, forDoctor, setStatus, takenTimes,
  studentIdsForDoctor, hasRelationship, countByStatus
};
