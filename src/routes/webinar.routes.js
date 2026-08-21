const router = require("express").Router();

const {
  createWebinarOrder,
  verifyWebinarPayment,
} = require("../controllers/webinar.controllers");

router.post("/create-order", createWebinarOrder);

router.post("/verify", verifyWebinarPayment);

module.exports = router;
