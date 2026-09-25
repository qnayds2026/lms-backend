const router = require("express").Router();

const registrationController = require("../controllers/programRegistration.controllers");

const authMiddleware = require("../middleware/auth.middleware");

const roleMiddleware = require("../middleware/role.middleware");

// Admin: Search Registration by Email
router.get(
  "/search",
  authMiddleware,
  roleMiddleware("ADMIN"),
  registrationController.search,
);

// Admin: Get Registrations for a Program
router.get(
  "/program/:programId",
  authMiddleware,
  roleMiddleware("ADMIN"),
  registrationController.getByProgram,
);

// Admin: Get Single Registration
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  registrationController.getOne,
);

// Admin: Get Registration Status
router.get(
  "/:id/status",
  authMiddleware,
  roleMiddleware("ADMIN"),
  registrationController.getStatus,
);

module.exports = router;