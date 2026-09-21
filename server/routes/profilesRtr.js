const express = require('express');
const router = express.Router();
const authmdlwre = require('../middleware/authMdlwre');
const profilesCtrl = require('../controllers/profilesCtrl');

// each profile type reads under the permission key of the register that owns the entity,
// so a role that can view cattle records can also open a cattle profile - no new keys
const PROFILE_PERMISSION_KEYS = {
    'dairy-farm': 'dairy-farm',
    'branch': 'dairy-farm',
    'cattle': 'cattle',
};

// picks the permission check for the requested type; an unknown type falls through to the
// controller, which answers 404 without revealing anything
const authorizeProfile = (req, res, next) => {
    const key = PROFILE_PERMISSION_KEYS[req.params.type];
    if (!key) return next();
    return authmdlwre.isAuthorized(key, 'read')(req, res, next);
};

router.get('/:type/:id', authmdlwre.isAuthenticated, authorizeProfile, profilesCtrl.getProfileCtrl);

module.exports = router;
