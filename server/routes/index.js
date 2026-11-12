// One place that lists every API route group.
const router = require('express').Router();

router.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
router.use('/auth', require('./authRoutes'));
router.use('/', require('./studentRoutes'));          // /mood /assessments /reminders /chat /tips
router.use('/appointments', require('./appointmentRoutes'));
router.use('/doctor', require('./doctorRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/notifications', require('./notificationRoutes'));

module.exports = router;
