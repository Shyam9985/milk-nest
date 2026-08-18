const express = require('express');
const router = express.Router();
const authmdlwre = require('../middleware/authMdlwre');
const profileCtrl = require('../controllers/profileCtrl');

router.get('/', authmdlwre.isAuthenticated, profileCtrl.getProfile);

module.exports = router;
