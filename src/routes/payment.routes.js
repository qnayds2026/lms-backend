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
router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("ADMIN"),
  paymentController.updateStatus,
);

module.exports = router;
