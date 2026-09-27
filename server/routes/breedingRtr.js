const express = require('express');
const router = express.Router();
const authmdlwre = require('../middleware/authMdlwre');
const breedingCtrl = require('../controllers/breedingCtrl');
const { audit } = require('../middleware/auditMdlwre');

// breeding routes - pregnancy, dry-off, calving and calf registration.
// all behind the single 'cattle-lyfecycle' permission key
const KEY = 'cattle-lyfecycle';

router.get('/', authmdlwre.isAuthenticated, authmdlwre.isAuthorized(KEY, 'read'), breedingCtrl.getPregnancyListCtrl);

router.post('/', authmdlwre.isAuthenticated, authmdlwre.isAuthorized(KEY, 'create'),
    audit('PREGNANCY', 'CREATE', 'cattle_pregnancy_lst_t', 'pregnancy_id'), breedingCtrl.createPregnancyCtrl);

router.put('/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized(KEY, 'update'),
    audit('PREGNANCY', 'UPDATE', 'cattle_pregnancy_lst_t', 'pregnancy_id'), breedingCtrl.updatePregnancyCtrl);

// the incharge confirming she has stopped giving milk
router.put('/:id/dry-off', authmdlwre.isAuthenticated, authmdlwre.isAuthorized(KEY, 'update'),
    audit('PREGNANCY_DRY_OFF', 'UPDATE', 'cattle_pregnancy_lst_t', 'pregnancy_id'), breedingCtrl.markDryOffCtrl);

// closes the pregnancy and registers the calves
router.put('/:id/calving', authmdlwre.isAuthenticated, authmdlwre.isAuthorized(KEY, 'update'),
    audit('PREGNANCY_CALVING', 'UPDATE', 'cattle_pregnancy_lst_t', 'pregnancy_id'), breedingCtrl.recordCalvingCtrl);

router.put('/:id/abort', authmdlwre.isAuthenticated, authmdlwre.isAuthorized(KEY, 'update'),
    audit('PREGNANCY_ABORT', 'UPDATE', 'cattle_pregnancy_lst_t', 'pregnancy_id'), breedingCtrl.markPregnancyAbortedCtrl);

router.delete('/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized(KEY, 'delete'),
    audit('PREGNANCY', 'DELETE', 'cattle_pregnancy_lst_t', 'pregnancy_id'), breedingCtrl.deletePregnancyCtrl);

module.exports = router;
