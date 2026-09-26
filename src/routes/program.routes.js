const router = require("express").Router();

const programController = require("../controllers/program.controllers");
const registrationController = require("../controllers/programRegistration.controllers");
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

// Admin: Create Program
router.post("/", auth, role("ADMIN"), programController.create);

// Get All Programs
router.get("/", programController.getAll);

// Get Single Program
router.get("/:id", programController.getOne);

// Admin: Update Program
router.patch("/:id", auth, role("ADMIN"), programController.update);

// Admin: Activate Program
router.patch("/:id/activate", auth, role("ADMIN"), programController.activate);

// Admin: Deactivate Program
router.patch("/:id/deactivate", auth, role("ADMIN"), programController.deactivate);

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