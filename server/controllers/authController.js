const asyncHandler = require('../utils/asyncHandler');
const auth = require('../services/authService');
const doctors = require('../models/doctorModel');

exports.signup = asyncHandler(async (req, res) => res.status(201).json(await auth.signup(req.body || {})));
exports.login = asyncHandler(async (req, res) => res.json(await auth.login(req.body || {})));
exports.forgot = asyncHandler(async (req, res) => res.json(await auth.forgotPassword((req.body || {}).email)));
exports.me = (req, res) => res.json({ user: req.user });

exports.listDoctors = asyncHandler(async (req, res) => {
  const rows = await doctors.listApproved();
  res.json({ doctors: rows.map(d => ({ id: d.id, name: d.name, email: d.email, specialization: d.specialization })) });
});
