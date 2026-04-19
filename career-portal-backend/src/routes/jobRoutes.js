const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const jobController = require("../controllers/jobController");
const userController = require("../controllers/userController");
const upload = require("../middleware/uploadResume");
const {
  getDepartmentCounts,
} = require("../controllers/jobController");

router.get("/department-counts", getDepartmentCounts);

// CREATE JOB
router.post("/jobs", verifyToken, roleMiddleware("user"), jobController.createJob);

// GET ALL JOBS
router.get("/all-jobs", verifyToken, roleMiddleware("user"), jobController.getAllJobs);

// GET LATEST JOBS (PUBLIC)
router.get("/public-latest-jobs", jobController.getLatestJobs);
router.get("/public-job/:id", jobController.getJobById);

// GET LATEST JOBS (PROTECTED)
router.get("/latest-jobs", verifyToken, roleMiddleware("user"), jobController.getLatestJobs);

// GET JOB BY ID
router.get("/job/:id", verifyToken, roleMiddleware("user"), jobController.getJobById);

// APPLY JOB
router.post(
  "/apply",
  verifyToken,
  roleMiddleware("user"),
  upload.single("resume"),
  userController.applyJob
);

// MY APPLICATIONS
router.get(
  "/my-applications",
  verifyToken,
  roleMiddleware("user"),
  jobController.getMyApplications
);

// CHECK APPLICATION STATUS
router.get(
  "/check-application/:jobId",
  verifyToken,
  roleMiddleware("user"),
  jobController.checkApplicationStatus
);

// UPDATE APPLICATION STATUS
router.put(
  "/applications/:id/status",
  verifyToken,
  roleMiddleware("admin"),
  jobController.updateApplicationStatus
);

// SEARCH
router.get("/search", jobController.searchJobs);

// DEPARTMENT STATS
router.get("/department-stats", jobController.getDepartmentStats);

module.exports = router;