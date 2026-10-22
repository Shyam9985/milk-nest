const express = require('express');
const router = express.Router();
const authmdlwre = require('../middleware/authMdlwre');
const { checkRateLimit } = require('../middleware/rateLimitmdlwre');
const backfillCtrl = require('../controllers/backfillCtrl');
const { audit } = require('../middleware/auditMdlwre');

/*
 * Data backfill. Its own permission key, NOT 'milk-production': the incharge holds that one, and
 * generating a month of figures is not something a branch incharge should be able to do. Grant
 * 'data-backfill' to the super user alone.
 *
 * The run is rate limited harder than a normal write - it is the one endpoint here that can create
 * a thousand rows in a single call, so hammering it should not be cheap.
 */
const KEY = 'data-backfill';

router.get('/preview', authmdlwre.isAuthenticated, checkRateLimit(1, 60),
    authmdlwre.isAuthorized(KEY, 'read'), backfillCtrl.previewBackfillCtrl);

router.post('/run', authmdlwre.isAuthenticated, checkRateLimit(0.2, 10),
    authmdlwre.isAuthorized(KEY, 'create'),
    audit('MILK_BACKFILL', 'RUN'), backfillCtrl.runBackfillCtrl);

module.exports = router;
