const express = require('express');
const router = express.Router();
const { register, login, verifyEmail, resendVerificationEmail, getProfile, getAdmins } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.get('/verify-email', verifyEmail);
router.post('/login', login);
// router.post('/forgot-password', forgotPassword);
router.post('/resend-verification-email', resendVerificationEmail);
router.get('/profile', auth, getProfile);
router.get('/admins', auth, getAdmins);

module.exports = router;
