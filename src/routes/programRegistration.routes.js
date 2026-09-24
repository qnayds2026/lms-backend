const express = require("express");

const router = express.Router();

const { register } = require("../controllers/programRegistration.controllers");

// ==========================================
// External Program Registration
// ==========================================

// POST /api/programs/:programId/register
router.post("/:programId/register", register);

module.exports = router;