const router = require("express").Router();
const paymentController = require("../controllers/payment.controllers");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

router.post(
  "/manual",
  authMiddleware,
  roleMiddleware("STUDENT"),
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
router.post(
  "/create-order",
  authMiddleware,
  roleMiddleware("STUDENT"),
  paymentController.createOrder,
);
router.post("/webhook", paymentController.razorpayWebhook);

module.exports = router;
