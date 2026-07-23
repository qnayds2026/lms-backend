const router = require("express").Router();

const { createLandingOrder } = require("../controllers/landing.controllers");

router.post("/create-order", createLandingOrder);

module.exports = router;
