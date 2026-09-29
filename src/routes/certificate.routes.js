const router = require("express").Router();

const auth = require("../middleware/auth.middleware");
const certificateController = require("../controllers/certificate.controllers");

// Public certificate verification
// GET /api/certificates/verify/:verificationCode
router.get(
  "/verify/:verificationCode",
  certificateController.verifyCertificate,
);

// Student's certificates
// GET /api/certificates/my
router.get("/my", auth, certificateController.getMyCertificates);

// Student's individual certificate
// GET /api/certificates/:id
router.get("/:id", auth, certificateController.getCertificateById);

module.exports = router;
