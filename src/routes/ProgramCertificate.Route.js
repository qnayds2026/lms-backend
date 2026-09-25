const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const {
  getMyCertificates,
  getCertificateById,
  approveCertificateRequestController,
  rejectCertificateRequestController,
  downloadCertificate,
} = require("../controllers/ProgramCertificate.Controller");

// ==========================================
// Student APIs
// ==========================================

// Get logged-in student's certificates
// GET /api/program-certificates/my
router.get("/my", auth, getMyCertificates);

// Get single certificate by ID (student ownership verified)
// GET /api/program-certificates/:id
router.get("/:id", auth, getCertificateById);

// Download certificate as PDF (student ownership verified / Admin any)
// GET /api/program-certificates/:id/download
router.get("/:id/download", auth, downloadCertificate);

// ==========================================
// Admin APIs
// ==========================================

// Approve certificate request & create certificate
// PATCH /api/program-certificates/:id/approve
router.patch(
  "/:id/approve",
  auth,
  role("ADMIN"),
  approveCertificateRequestController,
);

// Reject certificate request
// PATCH /api/program-certificates/:id/reject
router.patch(
  "/:id/reject",
  auth,
  role("ADMIN"),
  rejectCertificateRequestController,
);

module.exports = router;
