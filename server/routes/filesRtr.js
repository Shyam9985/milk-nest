const express = require("express");
const router = express.Router();
const filesCtrl = require("../controllers/filesCtrl");
const { isAuthenticated, isAuthorized } = require("../middleware/authMdlwre");

router.post("/upload", isAuthenticated, filesCtrl.uploadFiles);
router.get("/profile-photo", isAuthenticated, filesCtrl.getProfilePhoto);

module.exports = router;
