const bcrypt = require('bcryptjs');
const users = require('../models/userModel');
const doctors = require('../models/doctorModel');
const reminders = require('../models/reminderModel');
const notifications = require('../models/notificationModel');
const { signToken } = require('../middleware/auth');
const { isEmail, clean, requireFields } = require('../middleware/validate');
const { badRequest, conflict, notFound, unauthorized, forbidden } = require('../utils/httpError');
const { toUser } = require('../utils/format');

async function signup(body) {
  const role = body.role === 'doctor' ? 'doctor' : 'student'; // admins are never created via signup
  requireFields(body, ['name'], { name: 'your name' });
  if (!isEmail(body.email)) throw badRequest('Please enter a valid email address.');
  if (!body.password || body.password.length < 8) throw badRequest('Password must be at least 8 characters.');

  if (role === 'doctor') {
    requireFields(body, ['licenseNumber', 'licenseAuthority', 'specialization'], {
      licenseNumber: 'your medical licence number',
      licenseAuthority: 'the council or board that issued your licence',
      specialization: 'your specialization'
    });
  }

  const email = clean(body.email).toLowerCase();
  if (await users.findByEmailAndRole(email, role)) throw conflict('An account with this email already exists. Please sign in.');

  const id = await users.create({
    name: clean(body.name), email, role,
    passwordHash: await bcrypt.hash(body.password, 10)
  });

  if (role === 'student') {
    await reminders.seedDefaults(id);
    return { message: 'Welcome aboard! Your account is ready — you can sign in now.' };
  }

  await doctors.createProfile({
    userId: id,
    licenseNumber: clean(body.licenseNumber),
    licenseAuthority: clean(body.licenseAuthority),
    specialization: clean(body.specialization),
    npiNumber: clean(body.npiNumber)
  });
  const admins = await users.idsByRole('admin');
  await notifications.addMany(admins, 'New doctor verification request',
    `${clean(body.name)} (${clean(body.licenseAuthority)}, licence ${clean(body.licenseNumber)}) is waiting for review.`);
  return { message: 'Account created. An admin will verify your licence before you can sign in — you will be notified.' };
}

async function login({ email, password, role }) {
  const r = ['doctor', 'admin'].includes(role) ? role : 'student';
  if (!isEmail(email)) throw badRequest('Please enter a valid email address.');
  if (!password) throw badRequest('Please enter your password.');

  const user = await users.findByEmailAndRole(clean(email), r);
  // Same message for "no such user" and "wrong password" would be stricter; we keep the
  // friendlier split because this is a demo app with seeded accounts.
  if (!user) throw notFound('No account found for that email. Try signing up.');
  if (!(await bcrypt.compare(password, user.password_hash))) throw unauthorized('That password is not right. Please try again.');
  if (!user.is_active) throw forbidden('This account has been deactivated. Please contact an administrator.');

  if (r === 'doctor') {
    const profile = await doctors.getProfile(user.id);
    if (profile.verification_status === 'pending') {
      throw forbidden('Your doctor account is still waiting for admin verification. You can sign in once it is approved.');
    }
    if (profile.verification_status === 'rejected') {
      throw forbidden(`Your doctor account was not verified.${profile.verification_notes ? ' Reason: ' + profile.verification_notes : ''}`);
    }
  }
  return { token: signToken(user), user: toUser(user) };
}

async function forgotPassword(email) {
  if (!isEmail(email)) throw badRequest('Please enter a valid email address.');
  // Deliberately identical response whether or not the account exists (no user enumeration).
  // A real deployment would email a one-time reset link here.
  return { message: `If an account exists for ${clean(email)}, a reset link is on its way.` };
}

module.exports = { signup, login, forgotPassword };
