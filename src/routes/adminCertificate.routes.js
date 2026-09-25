const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const {
  getAllCertificates,
  getCertificateById,
  searchCertificates,
} = require("../controllers/adminCertificate.controllers");

// ==========================================
// Admin Certificate Management APIs
// All routes require ADMIN role
// ==========================================

// Search certificates (must be before /:id to avoid route conflict)
// GET /api/admin/certificates/search?query=...
router.get("/search", auth, role("ADMIN"), searchCertificates);

// Get all certificates with filters
// GET /api/admin/certificates?type=&programId=&courseId=&studentId=&certificateNumber=&date=&page=&limit=
router.get("/", auth, role("ADMIN"), getAllCertificates);

// Get single certificate by ID
// GET /api/admin/certificates/:id
router.get("/:id", auth, role("ADMIN"), getCertificateById);

module.exports = router;