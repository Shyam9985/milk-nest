
const express = require('express');
const router = express.Router();
const authCtrl = require('../modules/controllers/authctrl');

router.post('/signup', authCtrl.signUp)


module.exports =  router ;