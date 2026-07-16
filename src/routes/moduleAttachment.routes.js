const router = require("express").Router();

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

const attachmentController = require("../controllers/moduleAttachment.controllers");

router.get("/module/:moduleId", auth, attachmentController.getByModule);

router.post(
  "/",
  auth,
  role("INSTRUCTOR", "ADMIN"),
  attachmentController.create,
);

router.delete(
  "/:id",
  auth,
  role("INSTRUCTOR", "ADMIN"),
  attachmentController.remove,
);

module.exports = router;
