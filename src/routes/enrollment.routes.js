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

module.exports = router;
