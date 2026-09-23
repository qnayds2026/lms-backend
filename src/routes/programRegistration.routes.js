const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const {
  getMyProgramsController,
  requestCertificateController,
  getAllCertificateRequestsController,
  getCertificateRequestByIdController,
  approveCertificateRequestController,
  rejectCertificateRequestController,
} = require("../controllers/programRegistration.controllers");

// ==========================================
// Student APIs (STUDENT only)
// ==========================================

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

// Task 4: Alternative route for single certificate request
router.get(
  "/:id/certificate-request",
  auth,
  role("ADMIN"),
  getCertificateRequestByIdController,
);

// Task 5: Approve certificate request
router.patch(
  "/:id/certificate-request/approve",
  auth,
  role("ADMIN"),
  approveCertificateRequestController,
);

// Task 5: Reject certificate request
router.patch(
  "/:id/certificate-request/reject",
  auth,
  role("ADMIN"),
  rejectCertificateRequestController,
);

module.exports = router;
