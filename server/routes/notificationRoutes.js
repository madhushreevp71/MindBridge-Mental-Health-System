const router = require('express').Router();
const c = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);
router.get('/', c.list);
router.patch('/read-all', c.readAll);
router.patch('/:id/read', c.read);

module.exports = router;
