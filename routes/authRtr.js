
const express = require('express');
const router = express.Router();
const authCtrl = require('../modules/controllers/authctrl');

const authmdlwre = require('../middleware/authMdlwre')

router.post('/signup', authCtrl.signUp);
router.post('/login', authCtrl.logIn);
router.get('/all-users', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('users', 'read'), authCtrl.getAllusers);
router.get('/reset-password/send-email', authmdlwre.isAuthenticated, authCtrl.sendResetPasswordEmail);
router.post('/email/verify-otp', authmdlwre.isAuthenticated, authCtrl.verifyEmailOtp);
router.get('/forgot-password', authmdlwre.isAuthenticated, authCtrl.forgotPassword);


module.exports = router;