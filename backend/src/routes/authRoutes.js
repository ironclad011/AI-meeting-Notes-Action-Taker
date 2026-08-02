const express = require('express');
const { register, login, logout, me } = require('../controllers/authController');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/auth');
const { registerSchema, loginSchema } = require('../schemas/authSchemas');

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authMiddleware, me);

module.exports = router;
