const express = require('express');
const router = express.Router();
const authmdlwre = require('../middleware/authMdlwre');
const milkCtrl = require('../controllers/milkCtrl');
const { audit } = require('../middleware/auditMdlwre');

// milk production routes - operational daily data, mounted outside /settings
router.get('/', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('milk-production', 'read'), milkCtrl.getMilkProductionListCtrl);
router.get('/sheet', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('milk-production', 'read'), milkCtrl.getMilkProductionSheetCtrl);
router.post('/sheet', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('milk-production', 'create'), audit('MILK_PRODUCTION', 'SAVE'), milkCtrl.saveMilkProductionSheetCtrl);
router.delete('/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('milk-production', 'delete'), audit('MILK_PRODUCTION', 'DELETE', 'milk_production_lst_t', 'milk_production_id'), milkCtrl.deleteMilkProductionCtrl);

module.exports = router;
