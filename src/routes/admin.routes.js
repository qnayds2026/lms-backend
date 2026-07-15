const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const {
  getAllCoursesAdmin,
  getAllInstructors,
  getInstructorById,
} = require("../controllers/admin.controller");

router.get("/courses", auth, role("ADMIN"), getAllCoursesAdmin);
router.get("/instructors", auth, role("ADMIN"), getAllInstructors);
router.get("/instructors/:id", auth, role("ADMIN"), getInstructorById);

module.exports = router;