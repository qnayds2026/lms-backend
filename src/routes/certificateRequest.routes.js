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

router.get("/my", auth, role("STUDENT"), getMyProgramsController);

router.post(
  "/:id/certificate-request",
  auth,
  role("STUDENT"),
  requestCertificateController,
);

// ==========================================
// Admin APIs (ADMIN only)
// ==========================================

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

router.patch(
  "/:id/certificate-request/approve",
  auth,
  role("ADMIN"),
  approveCertificateRequestController,
);

router.patch(
  "/:id/certificate-request/reject",
  auth,
  role("ADMIN"),
  rejectCertificateRequestController,
);

module.exports = router;