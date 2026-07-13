const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,

  toggleUserStatus,
} = require("../controllers/userController.js");

router.get("/", auth, role("ADMIN"), getUsers);
router.get("/:id", auth, role("ADMIN"), getUser);
router.put("/:id", auth, role("ADMIN"), updateUser);
router.patch("/:id/status", auth, role("ADMIN"), toggleUserStatus);
router.delete("/:id", auth, role("ADMIN"), deleteUser);

module.exports = router;
