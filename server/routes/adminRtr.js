const express = require('express');
const router = express.Router();
const authmdlwre = require('../middleware/authMdlwre');
const adminCtrl = require('../controllers/adminCtrl');

router.get('/menu-items', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('menu-items', 'read'), adminCtrl.getMenuItemsCtrl);
router.get('/setup-menus', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('menu-items', 'read'), adminCtrl.getSetupMenusCtrl);

module.exports = router;