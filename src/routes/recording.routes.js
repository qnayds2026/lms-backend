const express = require("express");
const router = express.Router();
const {
  createRecording,
  getRecordingsByModule,
  updateRecording,
  deleteRecording,
  publishRecording,
  unpublishRecording,
} = require("../controllers/recording.controller.js");
const authMiddleware = require("../middleware/auth.middleware.js");
const roleMiddleware = require("../middleware/role.middleware.js");

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["INSTRUCTOR", "ADMIN"]),
  createRecording
);

router.get("/module/:moduleId", authMiddleware, getRecordingsByModule);

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(["INSTRUCTOR", "ADMIN"]),
  updateRecording
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["INSTRUCTOR", "ADMIN"]),
  deleteRecording
);

router.patch(
  "/:id/publish",
  authMiddleware,
  roleMiddleware(["INSTRUCTOR", "ADMIN"]),
  publishRecording
);

router.patch(
  "/:id/unpublish",
  authMiddleware,
  roleMiddleware(["INSTRUCTOR", "ADMIN"]),
  unpublishRecording
);

module.exports = router;