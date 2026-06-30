const router = require("express").Router();

const enrollmentController = require("../controllers/enrollment.controllers");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

router.post(
  "/",
  authMiddleware,
  roleMiddleware("STUDENT"),
  enrollmentController.create,
);
router.get(
  "/my-courses",
  authMiddleware,
  roleMiddleware("STUDENT"),
  enrollmentController.myCourses,
);
router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  enrollmentController.getAll,
);
router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("ADMIN"),
  enrollmentController.updateStatus,
);

module.exports = router;
