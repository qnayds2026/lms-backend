const router = require("express").Router();

const registrationController = require("../controllers/programRegistration.controllers");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// Public: Register for a Program (external landing page)
router.post("/:programId/register", registrationController.register);

// Admin: Get all registrations for a Program
router.get(
  "/:programId/registrations",
  authMiddleware,
  roleMiddleware("ADMIN"),
  registrationController.getByProgram,
);

module.exports = router;