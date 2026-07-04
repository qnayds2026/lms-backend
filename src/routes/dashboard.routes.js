const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware.js");

const dashboardController = require("../controllers/dashboard.controllers.js");

router.get("/student", auth, dashboardController.studentDashboard);
router.get("/admin", auth, role("ADMIN"), dashboardController.adminDashboard);
router.get(
  "/instructor",
  auth,
  role("INSTRUCTOR", "ADMIN"),
  dashboardController.instructorDashboard,
);

module.exports = router;
