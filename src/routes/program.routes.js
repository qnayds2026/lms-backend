const router = require("express").Router();

const programController = require("../controllers/program.controllers");

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

module.exports = router;