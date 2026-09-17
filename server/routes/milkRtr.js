const express = require('express');
const router = express.Router();
const authmdlwre = require('../middleware/authMdlwre');
const milkCtrl = require('../controllers/milkCtrl');

// milk production routes - operational daily data, mounted outside /settings
router.get('/', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('milk-production', 'read'), milkCtrl.getMilkProductionListCtrl);
router.get('/sheet', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('milk-production', 'read'), milkCtrl.getMilkProductionSheetCtrl);
router.post('/sheet', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('milk-production', 'create'), milkCtrl.saveMilkProductionSheetCtrl);
router.delete('/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('milk-production', 'delete'), milkCtrl.deleteMilkProductionCtrl);

module.exports = router;
