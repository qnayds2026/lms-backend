const express = require("express");
const router = express.Router();
const {
  upsertReview,
  getReviewsByCourse,
  deleteReview,
} = require("../controllers/review.controller.js");
const authMiddleware = require("../middleware/auth.middleware.js");

router.post("/", authMiddleware, upsertReview);
router.get("/course/:courseId", authMiddleware, getReviewsByCourse);
router.delete("/:id", authMiddleware, deleteReview);

module.exports = router;