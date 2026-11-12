const { query, one } = require('../config/db');

const createProfile = ({ userId, licenseNumber, licenseAuthority, specialization, npiNumber }) =>
  query(
    `INSERT INTO doctor_profiles (user_id, license_number, license_authority, specialization, npi_number)
     VALUES (?,?,?,?,?)`,
    [userId, licenseNumber, licenseAuthority, specialization, npiNumber || null]
  );

const getProfile = userId => one('SELECT * FROM doctor_profiles WHERE user_id = ?', [userId]);

// Doctors a student is allowed to book: approved + active only.
const listApproved = () => query(`
  SELECT u.id, u.name, u.email, d.specialization
  FROM users u JOIN doctor_profiles d ON d.user_id = u.id
  WHERE u.role = 'doctor' AND u.is_active = 1 AND d.verification_status = 'approved'
  ORDER BY u.name`);

const listByStatus = status => query(`
  SELECT u.id, u.name, u.email, u.created_at,
         d.license_number, d.license_authority, d.specialization, d.npi_number,
         d.verification_status, d.verification_notes, d.verified_at
  FROM users u JOIN doctor_profiles d ON d.user_id = u.id
  WHERE u.role = 'doctor' ${status === 'all' ? '' : 'AND d.verification_status = ?'}
  ORDER BY u.created_at DESC`, status === 'all' ? [] : [status]);

const setVerification = (userId, status, notes, adminId) => query(
  `UPDATE doctor_profiles
   SET verification_status = ?, verification_notes = ?, verified_at = UTC_TIMESTAMP(), verified_by = ?
   WHERE user_id = ?`,
  [status, notes, adminId, userId]
);

module.exports = { createProfile, getProfile, listApproved, listByStatus, setVerification };
