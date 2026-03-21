const express = require('express');
const { register, login, getMe, updateUserRole } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/roles');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.patch('/users/:id/role', authenticate, authorize([ROLES.ADMIN]), updateUserRole);

module.exports = router;
