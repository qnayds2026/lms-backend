const express = require("express");
const router = express.Router();
const { createLiveClass, getLiveClassesByCourse } = require("../controllers/liveclass.controller.js");
const authMiddleware = require("../middleware/auth.middleware.js");
const roleMiddleware = require("../middleware/role.middleware.js");

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["INSTRUCTOR", "ADMIN"]),
  createLiveClass
);

router.get("/course/:courseId", authMiddleware, getLiveClassesByCourse);

module.exports = router;