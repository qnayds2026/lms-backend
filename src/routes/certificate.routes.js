const router = require("express").Router();

const auth = require("../middleware/auth.middleware");
const certificateController = require("../controllers/certificate.controllers");

// Public certificate verification
router.get(
  "/verify/:verificationCode",
  certificateController.verifyCertificate,
);
// Student's certiauth
router.get("/my", auth, certificateController.getMyCertificates);

// Student's individual certificate
router.get("/:id", auth, certificateController.getCertificateById);

// Download certificate as PDF (Student own / Admin any)
router.get("/:id/download", auth, certificateController.downloadCertificate);

module.exports = router;
