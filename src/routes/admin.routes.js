const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const {
  getAllCoursesAdmin,
  getAllInstructors,
} = require("../controllers/admin.controller");

router.get("/courses", auth, role("ADMIN"), getAllCoursesAdmin);
router.get("/instructors", auth, role("ADMIN"), getAllInstructors);

module.exports = router;