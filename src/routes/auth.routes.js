const router = require("express").Router();
const authController = require("../controllers/auth.controllers.js");
const protected = require("../middleware/auth.middleware.js");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/google", authController.googleLogin);
router.get("/user/me", protected, authController.getCurrentUser);
router.post("/activate-account", authController.activateAccountController);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);

module.exports = router;
