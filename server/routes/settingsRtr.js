const express = require('express');
const router = express.Router();
const authmdlwre = require('../middleware/authMdlwre');
const settingsCtrl = require('../controllers/settingsCtrl');

// state master routes
router.get('/master/state', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('state', 'read'), settingsCtrl.getStatesCtrl);
router.post('/master/state', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('state', 'create'), settingsCtrl.createStateCtrl);
router.put('/master/state/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('state', 'update'), settingsCtrl.updateStateCtrl);
router.delete('/master/state/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('state', 'delete'), settingsCtrl.deleteStateCtrl);

module.exports = router;
