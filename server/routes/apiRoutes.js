
const express = require('express');
const router = express.Router();
const authRtr = require('./authRtr');
const adminRtr = require('./adminRtr');
const settingsRtr = require('./settingsRtr');
const milkRtr = require('./milkRtr');
const dashboardRtr = require('./dashboardRtr');
const filesRouter = require('./filesRtr');
const profileRtr = require('./profileRtr');
const profilesRtr = require('./profilesRtr');

router.use('/auth', authRtr);
router.use('/admin', adminRtr);
router.use('/settings', settingsRtr);
router.use('/milk-production', milkRtr);
router.use('/dashboard', dashboardRtr);
router.use('/files', filesRouter);
router.use('/profile', profileRtr);
router.use('/profiles', profilesRtr);

module.exports = router;