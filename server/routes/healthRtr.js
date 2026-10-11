const express = require('express');
const router = express.Router();
const authmdlwre = require('../middleware/authMdlwre');
const { checkRateLimit } = require('../middleware/rateLimitmdlwre');
const healthCtrl = require('../controllers/healthCtrl');
const { audit } = require('../middleware/auditMdlwre');

// cattle health: treatment episodes and the checkups under them. same permission as the rest of
// the lifecycle, since a treatment is what takes an animal off the milking sheet
const KEY = 'cattle-lyfecycle';

router.get('/', authmdlwre.isAuthenticated, checkRateLimit(1, 60),
    authmdlwre.isAuthorized(KEY, 'read'), healthCtrl.getHealthRegisterCtrl);

router.post('/', authmdlwre.isAuthenticated, checkRateLimit(0.5, 30),
    authmdlwre.isAuthorized(KEY, 'create'),
    audit('CATTLE_TREATMENT', 'CREATE'), healthCtrl.createTreatmentCtrl);

// the checkup routes sit above '/:id' so a literal path segment is never read as an id
router.delete('/checkups/:id', authmdlwre.isAuthenticated, checkRateLimit(0.5, 30),
    authmdlwre.isAuthorized(KEY, 'delete'),
    audit('CATTLE_CHECKUP', 'DELETE', 'cattle_treatment_history_t', 'history_id'), healthCtrl.deleteCheckupCtrl);

router.get('/:id/checkups', authmdlwre.isAuthenticated, checkRateLimit(1, 60),
    authmdlwre.isAuthorized(KEY, 'read'), healthCtrl.getCheckupListCtrl);

router.post('/:id/checkups', authmdlwre.isAuthenticated, checkRateLimit(0.5, 30),
    authmdlwre.isAuthorized(KEY, 'create'),
    audit('CATTLE_CHECKUP', 'CREATE'), healthCtrl.addCheckupCtrl);

router.put('/:id/close', authmdlwre.isAuthenticated, checkRateLimit(0.5, 30),
    authmdlwre.isAuthorized(KEY, 'update'),
    audit('CATTLE_TREATMENT', 'CURE', 'cattle_treatment_lst_t', 'treatment_id'), healthCtrl.closeTreatmentCtrl);

router.put('/:id/reopen', authmdlwre.isAuthenticated, checkRateLimit(0.5, 30),
    authmdlwre.isAuthorized(KEY, 'update'),
    audit('CATTLE_TREATMENT', 'REOPEN', 'cattle_treatment_lst_t', 'treatment_id'), healthCtrl.reopenTreatmentCtrl);

router.put('/:id', authmdlwre.isAuthenticated, checkRateLimit(0.5, 30),
    authmdlwre.isAuthorized(KEY, 'update'),
    audit('CATTLE_TREATMENT', 'UPDATE', 'cattle_treatment_lst_t', 'treatment_id'), healthCtrl.updateTreatmentCtrl);

router.delete('/:id', authmdlwre.isAuthenticated, checkRateLimit(0.5, 30),
    authmdlwre.isAuthorized(KEY, 'delete'),
    audit('CATTLE_TREATMENT', 'DELETE', 'cattle_treatment_lst_t', 'treatment_id'), healthCtrl.deleteTreatmentCtrl);

module.exports = router;
