const router = require("express").Router();
const paymentController = require("../controllers/payment.controllers");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const paymentRateLimiter = require("../middleware/paymentRateLimiter");

router.post(
  "/manual",
  authMiddleware,
  roleMiddleware("STUDENT"),
  paymentRateLimiter,
  paymentController.createManual,
);
router.get(
  "/my-payments",
  authMiddleware,
  roleMiddleware("STUDENT"),
  paymentController.myPayments,
);
router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  paymentController.allPayments,
);
router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("ADMIN"),
  paymentController.updateStatus,
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  paymentController.deletePaymentController,
);

router.post(
  "/create-order",
  authMiddleware,
  roleMiddleware("STUDENT"),
  paymentRateLimiter,
  paymentController.createOrder,
);
router.post("/webhook", paymentController.razorpayWebhook);
router.post("/verify", paymentController.verifyPayment);

module.exports = router;
