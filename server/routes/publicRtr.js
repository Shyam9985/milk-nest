const express = require('express');
const router = express.Router();
const publicCtrl = require('../controllers/publicCtrl');
const { audit } = require('../middleware/auditMdlwre');
const { checkRateLimit } = require('../middleware/rateLimitmdlwre');

// public website routes - NO authentication, so the rate limiter buckets every caller by ip.
// keep this file to data that is safe for anyone to read and writes that are safe for anyone to make
router.get('/stats', checkRateLimit(1, 30), publicCtrl.getPublicStatsCtrl);
// one enquiry request per ip every 10 minutes: a bucket of 1 that refills once in 600 seconds
router.post('/enquiries', checkRateLimit(1 / 600, 1), audit('ENQUIRY', 'CREATE'), publicCtrl.createEnquiryCtrl);

module.exports = router;
