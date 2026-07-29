const router = require("express").Router();

const {
  createLandingOrder,
  resendActivationEmail,
} = require("../controllers/landing.controllers");

router.post("/create-order", createLandingOrder);
router.post("/resend-activation", resendActivationEmail);

module.exports = router;
