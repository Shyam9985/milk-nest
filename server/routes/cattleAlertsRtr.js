const express = require('express');
const router = express.Router();
const authmdlwre = require('../middleware/authMdlwre');
const cattleAlertsCtrl = require('../controllers/cattleAlertsCtrl');

// cattle lifecycle alerts - read only, reuses the 'cattle' permission key since these are
// facts about the cattle register rather than a module of their own
router.get('/', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('cattle', 'read'), cattleAlertsCtrl.getCattleAlertsCtrl);

module.exports = router;
