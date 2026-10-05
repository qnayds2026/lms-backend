const express = require("express");

const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const {
  register,
  getMyProgramsController,
  requestCertificateController,
  getAllCertificateRequestsController,
  getCertificateRequestByIdController,
} = require("../controllers/programRegistration.controllers");

// ==========================================
// External Program Registration
// ==========================================

// POST /api/programs/:programId/register
router.post("/:programId/register", register);

// Task 2: Get logged-in student's external programs
router.get("/my", auth, role("STUDENT"), getMyProgramsController);

// Task 3: Request certificate
router.post(
  "/:id/certificate-request",
  auth,
  role("STUDENT"),
  requestCertificateController,
);

// ==========================================
// Admin APIs (ADMIN only)
// ==========================================

// Task 4: Get all certificate requests
router.get(
  "/certificate-requests",
  auth,
  role("ADMIN"),
  getAllCertificateRequestsController,
);

// Task 4: Get single certificate request by registration ID
router.get(
  "/certificate-requests/:id",
  auth,
  role("ADMIN"),
  getCertificateRequestByIdController,
);

module.exports = router;
