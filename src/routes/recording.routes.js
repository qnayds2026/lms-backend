const express = require("express");
const router = express.Router();
const { createRecording, getRecordingsByModule } = require("../controllers/recording.controller.js");
const authMiddleware = require("../middleware/auth.middleware.js");
const roleMiddleware = require("../middleware/role.middleware.js");

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["INSTRUCTOR", "ADMIN"]),
  createRecording
);

router.get("/module/:moduleId", authMiddleware, getRecordingsByModule);

module.exports = router;