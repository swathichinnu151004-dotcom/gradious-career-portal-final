const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const userController = require("../controllers/userController");
const upload = require("../middleware/uploadResume");

const {
  getUserProfile,
  updateUserProfile,
} = require("../controllers/userController");


// Dashboard summary
router.get(
  "/dashboard-summary",
  verifyToken,
  roleMiddleware("user"),
  userController.getUserDashboard
);
//apply-job
router.post(
  "/apply-job",
  verifyToken,
  roleMiddleware("user"),
  upload.single("resume"),   // 🔥 VERY IMPORTANT
  userController.applyJob
);

// My applications
router.get(
  "/my-applications",
  verifyToken,
  roleMiddleware("user"),
  userController.getMyApplications
);
// Application stats (for chart)
router.get(
  "/application-stats",
  verifyToken,
  roleMiddleware("user"),
  userController.getApplicationStats
);

router.get("/profile", verifyToken, roleMiddleware("user"), getUserProfile);
router.put("/profile", verifyToken, roleMiddleware("user"), updateUserProfile);
module.exports = router;