const router = require("express").Router();

const auth = require("../middleware/auth.middleware");

const notificationController = require("../controllers/notification.controllers");

router.get("/", auth, notificationController.myNotifications);

router.patch("/:id/read", auth, notificationController.readNotification);

module.exports = router;
