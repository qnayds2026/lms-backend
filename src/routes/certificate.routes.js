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

// Student's indiviauthificate
router.get("/:id", auth, certificateController.getCertificateById);


module.exports = router;
