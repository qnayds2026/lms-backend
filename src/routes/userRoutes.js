const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController.js");

router.get("/", auth, role("ADMIN"), getUsers);
router.get("/:id", auth, role("ADMIN"), getUser);
router.put("/:id", auth, role("ADMIN"), updateUser);
router.delete("/:id", auth, role("ADMIN"), deleteUser);

module.exports = router;
