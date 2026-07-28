
const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authctrl');
const authmdlwre = require('../middleware/authMdlwre');

router.post('/signup', authCtrl.signUp);
router.post('/login', authCtrl.logIn);
router.post('/logout', authCtrl.logOut);
router.get('/all-users', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('users', 'read'), authCtrl.getAllusers);
router.get('/reset-password/send-email', authmdlwre.isAuthenticated, authCtrl.sendResetPasswordEmail);
router.post('/email/verify-otp', authCtrl.verifyEmailOtp);
router.post('/forgot-password', authCtrl.forgotPassword);
router.post('/update-password', authCtrl.updatePassword);


module.exports = router;