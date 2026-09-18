const express = require('express');
const router = express.Router();
const authmdlwre = require('../middleware/authMdlwre');
const dashboardCtrl = require('../controllers/dashboardCtrl');

// dashboard routes - read only summaries, permission key 'dashboard'
router.get('/', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('dashboard', 'read'), dashboardCtrl.getDashboardCtrl);
router.get('/filters', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('dashboard', 'read'), dashboardCtrl.getDashboardFiltersCtrl);

module.exports = router;
