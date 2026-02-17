const express = require('express');
const router = express.Router();
const { register, login, verifyEmail, approveFieldExpert, approveFieldExpertViaEmail, rejectFieldExpert, getPendingExperts, resendVerificationEmail, getProfile, getAdmins, forgotPassword, resetPassword, resetPasswordPage } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.get('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password-page', resetPasswordPage);
router.post('/reset-password', resetPassword);
router.post('/resend-verification-email', resendVerificationEmail);

// Admin Routes
router.get('/approve-expert-email', approveFieldExpertViaEmail);  // Admin clicks link from email (no auth needed, uses token)
router.post('/approve-field-expert', auth, approveFieldExpert);
router.post('/reject-field-expert', auth, rejectFieldExpert);
router.get('/pending-experts', auth, getPendingExperts);

router.get('/profile', auth, getProfile);
router.get('/admins', auth, getAdmins);

module.exports = router;
