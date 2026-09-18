const express = require("express");
const router = express.Router();
const filesCtrl = require("../controllers/filesCtrl");
const { isAuthenticated, isAuthorized } = require("../middleware/authMdlwre");
const { audit } = require("../middleware/auditMdlwre");

router.post("/upload", isAuthenticated, audit("FILE", "UPLOAD", null, "file_id"), filesCtrl.uploadFiles);
router.get("/profile-photo", isAuthenticated, filesCtrl.getProfilePhoto);

module.exports = router;
