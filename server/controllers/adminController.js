const asyncHandler = require('../utils/asyncHandler');
const users = require('../models/userModel');
const doctors = require('../models/doctorModel');
const appts = require('../models/appointmentModel');
const notifications = require('../models/notificationModel');
const npi = require('../services/npiService');
const { badRequest, notFound } = require('../utils/httpError');

const countsToObject = rows => Object.fromEntries(rows.map(r => [r.status || r.role, r.n]));
const doctorDto = d => ({
  id: d.id, name: d.name, email: d.email, createdAt: d.created_at,
  licenseNumber: d.license_number, licenseAuthority: d.license_authority,
  specialization: d.specialization, npiNumber: d.npi_number || '',
  status: d.verification_status, notes: d.verification_notes || '', verifiedAt: d.verified_at
});

exports.overview = asyncHandler(async (req, res) => {
  const [roles, appointments, pending] = await Promise.all([
    users.countByRole(), appts.countByStatus(), doctors.listByStatus('pending')
  ]);
  res.json({ users: countsToObject(roles), appointments: countsToObject(appointments), pendingDoctors: pending.length });
});

// GET /api/admin/doctors?status=pending|approved|rejected|all
exports.listDoctors = asyncHandler(async (req, res) => {
  const status = ['pending', 'approved', 'rejected', 'all'].includes(req.query.status) ? req.query.status : 'pending';
  res.json({ doctors: (await doctors.listByStatus(status)).map(doctorDto) });
});

function decide(status) {
  return asyncHandler(async (req, res) => {
    const doc = await users.findById(req.params.id);
    if (!doc || doc.role !== 'doctor') throw notFound('Doctor account not found.');
    const notes = String((req.body || {}).notes || '').trim().slice(0, 500) ||
      (status === 'rejected' ? 'Details could not be confirmed.' : '');
    await doctors.setVerification(doc.id, status, notes, req.user.id);
    await notifications.add(doc.id,
      status === 'approved' ? 'Your account is verified' : 'Your account was not verified',
      status === 'approved' ? 'An admin confirmed your licence. You can now use the doctor dashboard.' : notes);
    res.json({ message: `${doc.name} has been ${status}.` });
  });
}
exports.approve = decide('approved');
exports.reject = decide('rejected');

// POST /api/admin/npi-lookup { npiNumber }
exports.npiLookup = asyncHandler(async (req, res) => {
  const number = String((req.body || {}).npiNumber || '').trim();
  if (!/^\d{10}$/.test(number)) throw badRequest('An NPI number has exactly 10 digits.');
  try {
    res.json(await npi.lookup(number));
  } catch (e) {
    res.status(502).json({ error: `Could not reach the NPI registry (${e.message}). Please verify manually.` });
  }
});

exports.listUsers = asyncHandler(async (req, res) => {
  const rows = await users.listAll();
  res.json({
    users: rows.map(u => ({
      id: u.id, name: u.name, email: u.email, role: u.role, active: !!u.is_active,
      createdAt: u.created_at, doctorStatus: u.verification_status || null
    }))
  });
});

exports.setActive = asyncHandler(async (req, res) => {
  const target = await users.findById(req.params.id);
  if (!target) throw notFound('User not found.');
  if (target.id === req.user.id) throw badRequest("You can't deactivate your own account.");
  await users.setActive(target.id, !!(req.body || {}).active);
  res.json({ message: `${target.name} is now ${(req.body || {}).active ? 'active' : 'deactivated'}.` });
});
