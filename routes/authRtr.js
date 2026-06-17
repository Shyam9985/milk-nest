
const express = require('express');
const router = express.Router();
const authCtrl = require('../modules/controllers/authctrl');

const authmdlwre = require('../middleware/authMdlwre')

router.post('/signup', authCtrl.signUp);
router.post('/login', authCtrl.logIn);
router.get('/all-users', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('users', 'read'), authCtrl.getAllusers);


module.exports = router;