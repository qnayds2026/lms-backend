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
const {
  getAllCertificatesAdmin,
  getCertificateByIdAdmin,
} = require("../controllers/ProgramCertificate.Controller");

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

// Admin Certificates (External Programs)
router.get("/certificates", auth, role("ADMIN"), getAllCertificatesAdmin);
router.get("/certificates/:id", auth, role("ADMIN"), getCertificateByIdAdmin);

module.exports = router;