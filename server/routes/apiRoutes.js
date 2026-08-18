
const express = require('express');
const router = express.Router();
const authRtr = require('./authRtr');
const adminRtr = require('./adminRtr');
const settingsRtr = require('./settingsRtr');
const filesRouter = require('./filesRtr');
const profileRtr = require('./profileRtr');

router.use('/auth', authRtr);
router.use('/admin', adminRtr);
router.use('/settings', settingsRtr);
router.use('/files', filesRouter);
router.use('/profile', profileRtr);

module.exports = router;