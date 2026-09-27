const express = require('express');
const router = express.Router();
const authmdlwre = require('../middleware/authMdlwre');
const { checkRateLimit } = require('../middleware/rateLimitmdlwre');
const cattleCtrl = require('../controllers/cattleCtrl');
const { audit } = require('../middleware/auditMdlwre');

// the cattle register - operational data, mounted outside /settings alongside milk production and
// breeding. cattle TYPE and BREED remain settings masters and stay on the settings router.
// the permission key is unchanged, so existing role grants keep working.
const KEY = 'cattle';

// the dropdown routes sit above '/:id' so a literal path segment is never read as an id
router.get('/form-options', authmdlwre.isAuthenticated, checkRateLimit(1, 60),
    authmdlwre.isAuthorized(KEY, 'read'), cattleCtrl.getCattleFormOptionsCtrl);

router.get('/branch', authmdlwre.isAuthenticated, checkRateLimit(1, 60),
    authmdlwre.isAuthorized(KEY, 'read'), cattleCtrl.getCattleBranchOptionsCtrl);

router.get('/breed', authmdlwre.isAuthenticated, checkRateLimit(1, 60),
    authmdlwre.isAuthorized(KEY, 'read'), cattleCtrl.getCattleBreedOptionsCtrl);

router.get('/', authmdlwre.isAuthenticated, checkRateLimit(1, 60),
    authmdlwre.isAuthorized(KEY, 'read'), cattleCtrl.getCattleListCtrl);

router.post('/', authmdlwre.isAuthenticated, checkRateLimit(0.5, 30),
    authmdlwre.isAuthorized(KEY, 'create'),
    audit('CATTLE', 'CREATE', 'cattle_lst_t', 'cattle_id'), cattleCtrl.createCattleCtrl);

router.put('/:id', authmdlwre.isAuthenticated, checkRateLimit(0.5, 30),
    authmdlwre.isAuthorized(KEY, 'update'),
    audit('CATTLE', 'UPDATE', 'cattle_lst_t', 'cattle_id'), cattleCtrl.updateCattleCtrl);

router.delete('/:id', authmdlwre.isAuthenticated, checkRateLimit(0.5, 30),
    authmdlwre.isAuthorized(KEY, 'delete'),
    audit('CATTLE', 'DELETE', 'cattle_lst_t', 'cattle_id'), cattleCtrl.deleteCattleCtrl);

module.exports = router;
