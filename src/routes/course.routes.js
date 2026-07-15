const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const {
  createCourse,
  getAllCourses,
  getCourse,
  updateCourse,
  deleteCourse,
  myCourses,
  getStudentCourses,
} = require("../controllers/course.controllers");

router.get("/", getAllCourses);
router.get("/mine", auth, role("INSTRUCTOR", "ADMIN"), myCourses);
router.get("/student", auth, getStudentCourses);
router.get("/:id", getCourse);
router.post("/", auth, role("INSTRUCTOR", "ADMIN"), createCourse);
router.put("/:id", auth, role("INSTRUCTOR", "ADMIN"), updateCourse);
router.delete("/:id", auth, role("INSTRUCTOR", "ADMIN"), deleteCourse);

module.exports = router;
