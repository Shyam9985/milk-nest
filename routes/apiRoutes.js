
const express = require('express');
const router = express.Router();
const authRtr = require('./authRtr');
const adminRtr = require('./adminRtr');

router.use('/auth', authRtr);
router.use('/admin', adminRtr);

module.exports = router;