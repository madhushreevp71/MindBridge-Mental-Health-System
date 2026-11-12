const router = require('express').Router();
const c = require('../controllers/appointmentController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

// student
router.get('/mine', requireRole('student'), c.studentList);
router.get('/slots', requireRole('student'), c.slots);
router.post('/', requireRole('student'), c.create);
router.patch('/:id/cancel', requireRole('student'), c.cancel);

// doctor
router.get('/inbox', requireRole('doctor'), c.doctorList);
router.patch('/:id/:action(accept|pending|reject)', requireRole('doctor'), c.doctorAction);

module.exports = router;
