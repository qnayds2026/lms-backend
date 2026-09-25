const router = require("express").Router();

const programController = require("../controllers/program.controllers");
const registrationController = require("../controllers/programRegistration.controllers");
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

// Create Program
router.post("/", programController.create);

// Get All Programs
router.get("/", programController.getAll);

// Get Single Program
router.get("/:id", programController.getOne);

// Update Program
router.patch("/:id", programController.update);

// Activate Program
router.patch("/:id/activate", programController.activate);

// Deactivate Program
router.patch("/:id/deactivate", programController.deactivate);

// Public: Register for a Program (external landing page)
router.post("/:programId/register", registrationController.register);

// Admin: Get all registrations for a Program
router.get(
  "/:programId/registrations",
  auth,
  role("ADMIN"),
  registrationController.getByProgram,
);

module.exports = router;