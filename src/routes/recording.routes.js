const express = require("express");
const router = express.Router();
const {
  createRecording,
  getRecordingsByModule,
  updateRecording,
  deleteRecording,
  publishRecording,
  unpublishRecording,
  reorderRecordings,
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

// NOTE: must be registered before "/:id" so "reorder" isn't matched as an :id param
router.patch(
  "/reorder",
  authMiddleware,
  roleMiddleware(["INSTRUCTOR", "ADMIN"]),
  reorderRecordings
);

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