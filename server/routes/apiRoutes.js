
const express = require('express');
const router = express.Router();
const authRtr = require('./authRtr');
const adminRtr = require('./adminRtr');
const settingsRtr = require('./settingsRtr');

router.use('/auth', authRtr);
router.use('/admin', adminRtr);
router.use('/settings', settingsRtr);

module.exports = router;