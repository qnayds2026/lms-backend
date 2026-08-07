const prisma = require("../lib/prisma.js");

// POST /api/reviews  (Student only, must be ACTIVE-enrolled in the course)
// Body: { courseId, rating, comment }
// Upserts — a student can only ever have one review per course; resubmitting
// updates the existing one instead of creating a duplicate.
async function upsertReview(req, res) {
  try {
    const { courseId, rating, comment } = req.body;

    if (!courseId || rating === undefined) {
      return res.status(400).json({ error: "courseId and rating are required" });
    }

    const parsedCourseId = parseInt(courseId);
    const parsedRating = parseInt(rating);

    if (isNaN(parsedCourseId)) {
      return res.status(400).json({ error: "courseId must be a valid number" });
    }

    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: "rating must be a whole number from 1 to 5" });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.id,
          courseId: parsedCourseId,
        },
      },
    });

    if (!enrollment || enrollment.status !== "ACTIVE") {
      return res.status(403).json({
        error: "You must be an enrolled student to review this course",
      });
    }

    const review = await prisma.review.upsert({
      where: {
        studentId_courseId: {
          studentId: req.user.id,
          courseId: parsedCourseId,
        },
      },
      update: {
        rating: parsedRating,
        comment: comment ?? null,
      },
      create: {
        rating: parsedRating,
        comment: comment ?? null,
        studentId: req.user.id,
        courseId: parsedCourseId,
      },
      include: {
        student: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json(review);
  } catch (err) {
    console.error("Error saving review:", err);
    return res.status(500).json({ error: "Failed to save review" });
  }
}

// GET /api/reviews/course/:courseId
// Returns all reviews for the course, the average rating, total count,
// and (if the requester is a logged-in student) their own review separately
// so the frontend can pre-fill the "your review" form.
async function getReviewsByCourse(req, res) {
  try {
    const { courseId } = req.params;
    const parsedCourseId = parseInt(courseId);

    if (isNaN(parsedCourseId)) {
      return res.status(400).json({ error: "courseId must be a valid number" });
    }

    const reviews = await prisma.review.findMany({
      where: { courseId: parsedCourseId },
      orderBy: { createdAt: "desc" },
      include: {
        student: { select: { id: true, name: true } },
      },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    const myReview = req.user
      ? reviews.find((r) => r.studentId === req.user.id) || null
      : null;

    return res.json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10, // one decimal place
      totalReviews,
      myReview,
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    return res.status(500).json({ error: "Failed to fetch reviews" });
  }
}

// DELETE /api/reviews/:id  (review owner, or Admin)
async function deleteReview(req, res) {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "id must be a valid number" });
    }

    const review = await prisma.review.findUnique({ where: { id: parsedId } });

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (review.studentId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Not authorized to delete this review" });
    }

    await prisma.review.delete({ where: { id: parsedId } });

    return res.json({ success: true, id: parsedId });
  } catch (err) {
    console.error("Error deleting review:", err);
    return res.status(500).json({ error: "Failed to delete review" });
  }
}

module.exports = { upsertReview, getReviewsByCourse, deleteReview };