const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const {
  createModule,
  getModulesByCourse,
  updateModule,
  deleteModule,
  reorderModules,
} = require("../controllers/module.controller");

router.get("/course/:courseId", auth, getModulesByCourse);
router.post("/", auth, role("INSTRUCTOR", "ADMIN"), createModule);
router.put("/:id", auth, role("INSTRUCTOR", "ADMIN"), updateModule);
router.delete("/:id", auth, role("INSTRUCTOR", "ADMIN"), deleteModule);
router.patch("/reorder", auth, role("INSTRUCTOR", "ADMIN"), reorderModules);

module.exports = router;