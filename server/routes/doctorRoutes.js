const router = require('express').Router();
const c = require('../controllers/doctorController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('doctor'));
router.get('/caseload', c.caseload);
router.get('/students/:id', c.studentDetail);
router.post('/recommendations', c.recommend);

module.exports = router;
