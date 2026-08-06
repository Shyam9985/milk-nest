const express = require('express');
const router = express.Router();
const authmdlwre = require('../middleware/authMdlwre');
const settingsCtrl = require('../controllers/settingsCtrl');

// state master routes
router.get('/master/state', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('state', 'read'), settingsCtrl.getStatesCtrl);
router.post('/master/state', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('state', 'create'), settingsCtrl.createStateCtrl);
router.put('/master/state/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('state', 'update'), settingsCtrl.updateStateCtrl);
router.delete('/master/state/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('state', 'delete'), settingsCtrl.deleteStateCtrl);

// district master routes
router.get('/master/district', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('district', 'read'), settingsCtrl.getDistrictsCtrl);
router.post('/master/district', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('district', 'create'), settingsCtrl.createDistrictCtrl);
router.put('/master/district/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('district', 'update'), settingsCtrl.updateDistrictCtrl);
router.delete('/master/district/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('district', 'delete'), settingsCtrl.deleteDistrictCtrl);

// mandal/ULB master routes
router.get('/master/mandal', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('mandal', 'read'), settingsCtrl.getMandalsCtrl);
router.post('/master/mandal', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('mandal', 'create'), settingsCtrl.createMandalCtrl);
router.put('/master/mandal/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('mandal', 'update'), settingsCtrl.updateMandalCtrl);
router.delete('/master/mandal/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('mandal', 'delete'), settingsCtrl.deleteMandalCtrl);

// role master routes (hierarchy list feeds the role form dropdown)
router.get('/master/role', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role', 'read'), settingsCtrl.getRolesCtrl);
router.get('/master/role/hierarchy', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role', 'read'), settingsCtrl.getRoleHierarchiesCtrl);
router.post('/master/role', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role', 'create'), settingsCtrl.createRoleCtrl);
router.put('/master/role/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role', 'update'), settingsCtrl.updateRoleCtrl);
router.delete('/master/role/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role', 'delete'), settingsCtrl.deleteRoleCtrl);

// village/sachivalayam master routes
router.get('/master/village', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('village', 'read'), settingsCtrl.getVillagesCtrl);
router.post('/master/village', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('village', 'create'), settingsCtrl.createVillageCtrl);
router.put('/master/village/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('village', 'update'), settingsCtrl.updateVillageCtrl);
router.delete('/master/village/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('village', 'delete'), settingsCtrl.deleteVillageCtrl);

module.exports = router;
