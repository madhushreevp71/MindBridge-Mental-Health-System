const router = require('express').Router();
const c = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('admin'));
router.get('/overview', c.overview);
router.get('/doctors', c.listDoctors);
router.post('/doctors/:id/approve', c.approve);
router.post('/doctors/:id/reject', c.reject);
router.post('/npi-lookup', c.npiLookup);
router.get('/users', c.listUsers);
router.patch('/users/:id/active', c.setActive);

module.exports = router;
