const db = require("../config/connectDB");

// USER DASHBOARD SUMMARY
exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // TOTAL JOBS
    const [jobs] = await db.query(
      "SELECT COUNT(*) AS totalJobs FROM jobs WHERE status = 'ACTIVE'"
    );

    // TOTAL APPLIED
    const [applied] = await db.query(
      "SELECT COUNT(*) AS totalApplied FROM applications WHERE user_id = ?",
      [userId]
    );

    // SHORTLISTED
    const [shortlisted] = await db.query(
      "SELECT COUNT(*) AS totalShortlisted FROM applications WHERE user_id = ? AND status = 'Shortlisted'",
      [userId]
    );

    // REJECTED
    const [rejected] = await db.query(
      "SELECT COUNT(*) AS totalRejected FROM applications WHERE user_id = ? AND status = 'Rejected'",
      [userId]
    );

    res.json({
      totalJobs: jobs[0].totalJobs,
      totalApplied: applied[0].totalApplied,
      totalShortlisted: shortlisted[0].totalShortlisted,
      totalRejected: rejected[0].totalRejected
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Error fetching dashboard" });
  }
};
// APPLY JOB
exports.applyJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const jobId = req.body.jobId || req.body.job_id;

    if (!userId) {
      return res.status(400).json({ message: "User is required" });
    }

    if (!jobId) {
      return res.status(400).json({ message: "Job ID is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Resume is required" });
    }

    // Check user exists
    const [userRows] = await db.query(
      "SELECT id, name FROM users WHERE id = ? AND role = 'user'",
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check job exists
    const [jobRows] = await db.query(
      "SELECT id, job_title FROM jobs WHERE id = ?",
      [jobId]
    );

    if (jobRows.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check duplicate application
    const [existingRows] = await db.query(
      "SELECT id FROM applications WHERE user_id = ? AND job_id = ?",
      [userId, jobId]
    );

    if (existingRows.length > 0) {
      return res.status(400).json({ message: "You already applied for this job" });
    }

    await db.query(
      `INSERT INTO applications (user_id, job_id, status, applied_date)
       VALUES (?, ?, ?, NOW())`,
      [userId, jobId, "Applied"]
    );
await db.query(
  `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
   VALUES (?, ?, ?, ?, ?, NOW())`,
  [
    userId,
    "Application Submitted",
    "Your job application has been submitted successfully.",
    "info",
    0
  ]
);
    return res.status(201).json({
      message: "Application submitted successfully"
    });
  } catch (error) {
    console.error("applyForJob error:", error);

    return res.status(500).json({
      message: "Server error while applying for the job"
    });
  }
};
// MY APPLICATIONS
exports.getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT
        applications.id,
        jobs.job_title,
        jobs.department,
        jobs.location,
        applications.status,
        applications.applied_date
      FROM applications
      JOIN jobs ON applications.job_id = jobs.id
      WHERE applications.user_id = ?
      ORDER BY applications.applied_date DESC
    `;

    const [result] = await db.query(sql, [userId]);

    res.json(result);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error fetching applications" });
  }
};

exports.getApplicationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        SUM(status = 'Applied') AS Applied,
        SUM(status = 'Pending') AS Pending,
        SUM(status = 'Shortlisted') AS Shortlisted,
        SUM(status = 'Rejected') AS Rejected
      FROM applications
      WHERE user_id = ?
    `;

    const [result] = await db.query(sql, [userId]);

    res.json({
      Applied: result[0].Applied || 0,
      Pending: result[0].Pending || 0,
      Shortlisted: result[0].Shortlisted || 0,
      Rejected: result[0].Rejected || 0
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error fetching stats" });
  }
};