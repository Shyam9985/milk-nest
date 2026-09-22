const express = require('express');
const router = express.Router();
const authmdlwre = require('../middleware/authMdlwre');
const { checkRateLimit } = require('../middleware/rateLimitmdlwre');
const adminCtrl = require('../controllers/adminCtrl');

router.get('/menu-items', authmdlwre.isAuthenticated, checkRateLimit(1, 60), authmdlwre.isAuthorized('menu-items', 'read'), adminCtrl.getMenuItemsCtrl);
router.get('/setup-menus', authmdlwre.isAuthenticated, checkRateLimit(1, 60), authmdlwre.isAuthorized('menu-items', 'read'), adminCtrl.getSetupMenusCtrl);
router.get('/genders', authmdlwre.isAuthenticated, checkRateLimit(1, 60), authmdlwre.isAuthorized('users', 'read'), adminCtrl.getGendersCtrl);

module.exports = router;