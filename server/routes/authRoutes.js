const router = require('express').Router();
const c = require('../controllers/authController');
const rateLimit = require('../middleware/rateLimit');
const { requireAuth } = require('../middleware/auth');

const authLimiter = rateLimit({ windowMs: 60_000, max: 15 });

router.post('/signup', authLimiter, c.signup);
router.post('/login', authLimiter, c.login);
router.post('/forgot', authLimiter, c.forgot);
router.get('/me', requireAuth, c.me);
router.get('/doctors', requireAuth, c.listDoctors);

module.exports = router;
