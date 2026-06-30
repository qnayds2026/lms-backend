const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware.js");
const { createRecording, getRecordingsByModule } = require("../controllers/recording.controller.js");
const authMiddleware = require("../middleware/auth.middleware.js");
const roleMiddleware = require("../middleware/role.middleware.js");

// Only instructors/admins can upload
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["INSTRUCTOR", "ADMIN"]),
  upload.single("video"), // field name instructor's form must use: "video"
  createRecording
);

router.get("/module/:moduleId", authMiddleware, getRecordingsByModule);

module.exports = router;