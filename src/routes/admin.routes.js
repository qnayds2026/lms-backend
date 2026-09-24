const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const {
  getAllCoursesAdmin,
  getAllInstructors,
  getInstructorById,
} = require("../controllers/admin.controller");
const {
  getAllCertificateRequestsController,
  getCertificateRequestByIdController,
} = require("../controllers/programRegistration.controllers");

router.get("/courses", auth, role("ADMIN"), getAllCoursesAdmin);
router.get("/instructors", auth, role("ADMIN"), getAllInstructors);
router.get("/instructors/:id", auth, role("ADMIN"), getInstructorById);

// Task 4: Admin Certificate Requests
router.get(
  "/certificate-requests",
  auth,
  role("ADMIN"),
  getAllCertificateRequestsController,
);
router.get(
  "/certificate-requests/:id",
  auth,
  role("ADMIN"),
  getCertificateRequestByIdController,
);

module.exports = router;