const router = require("express").Router();
const noteController = require("../controllers/note.controllers");

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

// Admin & Instructor only
router.post(
  "/module/:moduleId",
  auth,
  role("ADMIN", "INSTRUCTOR"),
  noteController.createNote,
);
router.get("/module/:moduleId", auth, noteController.getNotes);
router.patch(
  "/:id",
  auth,
  role("ADMIN", "INSTRUCTOR"),
  noteController.updateNote,
);
router.delete(
  "/:id",
  auth,
  role("ADMIN", "INSTRUCTOR"),
  noteController.deleteNote,
);
module.exports = router;
