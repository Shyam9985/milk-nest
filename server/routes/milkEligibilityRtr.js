const express = require('express');
const router = express.Router();
const authmdlwre = require('../middleware/authMdlwre');
const { checkRateLimit } = require('../middleware/rateLimitmdlwre');
const milkEligibilityCtrl = require('../controllers/milkEligibilityCtrl');
const { audit } = require('../middleware/auditMdlwre');

// the manual overrides on can_produce_milk. same permission as the rest of the lifecycle,
// and audited against cattle_lst_t so the old flag is captured before it changes
const KEY = 'cattle-lyfecycle';

router.put('/:id/dry-off', authmdlwre.isAuthenticated, checkRateLimit(0.5, 30),
    authmdlwre.isAuthorized(KEY, 'update'),
    audit('CATTLE_LIFECYCLE', 'MANUAL_DRY_OFF', 'cattle_lst_t', 'cattle_id'),
    milkEligibilityCtrl.setManualMilkBlockCtrl);

router.put('/:id/resume-milking', authmdlwre.isAuthenticated, checkRateLimit(0.5, 30),
    authmdlwre.isAuthorized(KEY, 'update'),
    audit('CATTLE_LIFECYCLE', 'RESUME_MILKING', 'cattle_lst_t', 'cattle_id'),
    milkEligibilityCtrl.clearManualMilkBlockCtrl);

module.exports = router;
