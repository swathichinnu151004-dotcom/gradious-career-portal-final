const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const recruiterController = require("../controllers/recruiterController");


// ===============================
// Public recruiter invite routes
// ===============================
router.get("/validate-invite", recruiterController.validateInviteToken);
router.post("/register-recruiter", recruiterController.completeRecruiterSignup);

// ===============================
// Recruiter profile
// ===============================
// ================= Recruiter Profile =================

// GET recruiter profile
router.get(
  "/profile",
  verifyToken,
  roleMiddleware("recruiter"),
  recruiterController.getRecruiterProfile
);

// UPDATE recruiter profile
router.put(
  "/profile",
  verifyToken,
  roleMiddleware("recruiter"),
  recruiterController.updateProfile
);

// ===============================
// Recruiter dashboard
// ===============================
router.get(
  "/dashboard-summary",
  verifyToken,
  roleMiddleware("recruiter"),
  recruiterController.getRecruiterDashboardSummary
);

// ===============================
// Recruiter jobs
// ===============================
router.get("/jobs", verifyToken, roleMiddleware("recruiter"), recruiterController.getRecruiterJobs);
router.get("/jobs/:id", verifyToken, roleMiddleware("recruiter"), recruiterController.getRecruiterJobById);
router.post("/jobs", verifyToken, roleMiddleware("recruiter"), recruiterController.createJob);
router.put("/jobs/:id", verifyToken, roleMiddleware("recruiter"), recruiterController.updateJob);
router.delete("/jobs/:id", verifyToken, roleMiddleware("recruiter"), recruiterController.deleteJob);

// ===============================
// Recruiter applications
// ===============================
router.get("/applications", verifyToken, roleMiddleware("recruiter"), recruiterController.getApplications);
router.get("/applications/:id", verifyToken, roleMiddleware("recruiter"), recruiterController.getApplicationById);
router.put(
  "/applications/status/:id",
  verifyToken,
  roleMiddleware("recruiter"),
  recruiterController.updateApplicationStatus
);

module.exports = router;