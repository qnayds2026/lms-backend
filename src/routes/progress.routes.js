const router = require("express").Router();

const protected = require("../middleware/auth.middleware");
const progressController = require("../controllers/progress.controllers");

router.post(
  "/recordings/:recordingId/complete",
  protected,
  progressController.completeRecording,
);

router.get(
  "/course/:courseId",
  protected,
  progressController.getCourseProgress,
);

module.exports = router;
