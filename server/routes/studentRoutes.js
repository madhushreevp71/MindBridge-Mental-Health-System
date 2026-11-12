// Everything a signed-in student uses day to day.
// (Guards are applied per route on purpose: this router is mounted at "/", so a
// router-wide router.use(requireRole('student')) would also block doctors and admins.)
const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const mood = require('../controllers/moodController');
const assess = require('../controllers/assessmentController');
const reminders = require('../controllers/reminderController');
const chat = require('../controllers/chatController');
const tips = require('../controllers/tipController');

const student = [requireAuth, requireRole('student')];

router.get('/assessments/questions', assess.questions); // public: just the form shape

router.get('/mood', student, mood.list);
router.post('/mood', student, mood.create);

router.post('/assessments', student, assess.submit);
router.get('/assessments', student, assess.history);

router.get('/reminders', student, reminders.list);
router.post('/reminders', student, reminders.create);
router.patch('/reminders/:id', student, reminders.update);
router.delete('/reminders/:id', student, reminders.remove);

router.get('/chat', student, chat.history);
router.post('/chat', student, chat.send);
router.delete('/chat', student, chat.clear);

router.get('/tips', student, tips.random);

module.exports = router;
