const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const adminController = require("../controllers/adminController");

const {
  inviteRecruiter,
  getRecruiterInvites
} = require("../controllers/adminController");

// Send recruiter invite
router.post("/invite-recruiter", inviteRecruiter);
// Get all recruiter invites
router.get("/recruiter-invites", getRecruiterInvites);
// RESEND INVITE
router.post(
  "/resend-invite",
  verifyToken,
  roleMiddleware("admin"),
  adminController.resendInvite
);

// CANCEL INVITE
router.delete(
  "/invite/:id",
  verifyToken,
  roleMiddleware("admin"),
  adminController.cancelInvite
);

// Dashboard
router.get("/dashboard-summary", verifyToken, roleMiddleware("admin"), adminController.getDashboardSummary);

// Users
router.get("/users", verifyToken, roleMiddleware("admin"), adminController.getAllUsers);
router.get("/users/:id", verifyToken, roleMiddleware("admin"), adminController.getUserById);
router.put("/users/status/:id", verifyToken, roleMiddleware("admin"), adminController.updateUserStatus);
router.delete("/users/:id", verifyToken, roleMiddleware("admin"), adminController.deleteUser);
router.get("/recruiters", verifyToken, roleMiddleware("admin"), adminController.getAllRecruiters);

// Recruiters
router.get("/recruiters", verifyToken, roleMiddleware("recruiter"), adminController.getAllRecruiters);
router.get("/recruiters/:id", verifyToken, roleMiddleware("recruiter"), adminController.getRecruiterById);
router.put("/recruiters/status/:id", verifyToken, roleMiddleware("recruiter"), adminController.updateRecruiterStatus);
router.delete("/recruiters/:id", verifyToken, roleMiddleware("recruiter"), adminController.deleteRecruiter);
//Admin
// Recruiters (ADMIN ONLY)
router.get("/recruiters", verifyToken, roleMiddleware("admin"), adminController.getAllRecruiters);
router.get("/recruiters/:id", verifyToken, roleMiddleware("admin"), adminController.getRecruiterById);
router.put("/recruiters/status/:id", verifyToken, roleMiddleware("admin"), adminController.updateRecruiterStatus);
router.delete("/recruiters/:id", verifyToken, roleMiddleware("admin"), adminController.deleteRecruiter);
// Jobs
router.get("/jobs", verifyToken, roleMiddleware("admin"), adminController.getAllJobsForAdmin);
router.get("/jobs/:id", verifyToken, roleMiddleware("admin"), adminController.getJobByIdForAdmin);
router.put("/jobs/:id", verifyToken, roleMiddleware("admin"), adminController.updateJobByAdmin);
router.delete("/jobs/:id", verifyToken, roleMiddleware("admin"), adminController.deleteJobByAdmin);
router.get("/latest-jobs", verifyToken, roleMiddleware("admin"), adminController.getLatestJobs);

// Applications
router.get("/applications", verifyToken, roleMiddleware("admin"), adminController.getAllApplications);
router.get("/applications/:id", verifyToken, roleMiddleware("admin"), adminController.getApplicationById);
router.put("/applications/status/:id", verifyToken, roleMiddleware("admin"), adminController.updateApplicationStatus);

module.exports = router;