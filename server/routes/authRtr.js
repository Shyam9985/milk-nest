
const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authctrl');
const authmdlwre = require('../middleware/authMdlwre');
const { audit } = require('../middleware/auditMdlwre');

router.post('/signup', audit('USER', 'SIGNUP'), authCtrl.signUp);
router.post('/login', audit('USER', 'LOGIN'), authCtrl.logIn);
router.post('/logout', audit('USER', 'LOGOUT'), authCtrl.logOut);
router.get('/all-users', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('users', 'read'), authCtrl.getAllusers);
router.get('/reset-password/send-email', authmdlwre.isAuthenticated, audit('USER', 'RESET_PASSWORD_EMAIL'), authCtrl.sendResetPasswordEmail);
router.post('/email/verify-otp', audit('USER', 'VERIFY_OTP'), authCtrl.verifyEmailOtp);
router.post('/forgot-password', audit('USER', 'FORGOT_PASSWORD'), authCtrl.forgotPassword);
router.post('/update-password', audit('USER', 'UPDATE_PASSWORD'), authCtrl.updatePassword);


module.exports = router;