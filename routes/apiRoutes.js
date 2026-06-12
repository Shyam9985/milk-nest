
const express = require('express');
const router = express.Router();
const authRtr = require('./authRtr')


router.use('/auth', authRtr)


module.exports = router;