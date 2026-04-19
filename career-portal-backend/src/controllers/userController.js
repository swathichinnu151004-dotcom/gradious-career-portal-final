const db = require("../config/connectDB");
const logger = require("../utils/logger");
const { onUserAppliedToJob } = require("../services/notificationService");
const {
  sendJobApplicationConfirmationEmail,
} = require("../utils/sendJobApplicationConfirmationEmail");

// USER DASHBOARD SUMMARY
exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const [jobs] = await db.query(
      "SELECT COUNT(*) AS totalJobs FROM jobs WHERE status = 'ACTIVE'"
    );

    const [applied] = await db.query(
      "SELECT COUNT(*) AS appliedJobs FROM applications WHERE user_id = ?",
      [userId]
    );

    const [shortlisted] = await db.query(
      "SELECT COUNT(*) AS shortlisted FROM applications WHERE user_id = ? AND LOWER(status) = 'shortlisted'",
      [userId]
    );

    const [rejected] = await db.query(
      "SELECT COUNT(*) AS rejected FROM applications WHERE user_id = ? AND LOWER(status) = 'rejected'",
      [userId]
    );

    res.json({
      totalJobs: jobs[0].totalJobs || 0,
      appliedJobs: applied[0].appliedJobs || 0,
      shortlisted: shortlisted[0].shortlisted || 0,
      rejected: rejected[0].rejected || 0,
    });
  } catch (error) {
    logger.error("Dashboard error:", error);
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

    const resumePath = `uploads/resumes/${req.file.filename}`;

    const [userRows] = await db.query(
      `SELECT id, name, email FROM users
       WHERE id = ? AND LOWER(TRIM(role)) = 'user'`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const [jobRows] = await db.query(
      `SELECT id, job_title, recruiter_id, department, location, experience,
              status, description
       FROM jobs WHERE id = ?`,
      [jobId]
    );

    if (jobRows.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    const [existingRows] = await db.query(
      "SELECT id FROM applications WHERE user_id = ? AND job_id = ?",
      [userId, jobId]
    );

    if (existingRows.length > 0) {
      return res.status(400).json({ message: "You already applied for this job" });
    }

    const [insertApp] = await db.query(
      `INSERT INTO applications (user_id, job_id, resume, status, applied_date)
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, jobId, resumePath, "Applied"]
    );

    const applicationId = insertApp.insertId;
    const applicantName = userRows[0].name || "A candidate";
    const jobTitle = jobRows[0].job_title;
    const recruiterId = jobRows[0].recruiter_id;

    await onUserAppliedToJob({
      applicationId,
      applicantUserId: userId,
      applicantName,
      jobTitle,
      recruiterId,
    });

    const applicantEmail = String(userRows[0].email || "").trim();
    let emailStatus = "skipped";
    let emailError = null;

    if (!applicantEmail) {
      logger.warn("[applyJob] No email on user record; skipping confirmation email", {
        userId,
      });
    } else {
      try {
        await sendJobApplicationConfirmationEmail({
          to: applicantEmail,
          applicantName,
          job: jobRows[0],
          applicationId,
        });
        emailStatus = "sent";
        logger.info("[applyJob] Confirmation email sent", { applicationId });
      } catch (err) {
        emailStatus = "failed";
        emailError = err?.message || String(err);
        logger.error("[applyJob] Confirmation email failed:", emailError);
      }
    }

    return res.status(201).json({
      message: "Application submitted successfully",
      resume: resumePath,
      emailStatus,
      ...(emailStatus === "failed" && emailError
        ? { emailError }
        : {}),
    });
  } catch (error) {
    logger.error("applyJob error:", error);

    return res.status(500).json({
      message: "Server error while applying for the job",
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
        applications.job_id,
        jobs.job_title,
        jobs.department,
        jobs.location,
        jobs.experience,
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
    logger.error("getMyApplications failed:", err);
    return res.status(500).json({ message: "Error fetching applications" });
  }
};

// APPLICATION STATS
exports.getApplicationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        SUM(LOWER(status) = 'applied') AS Applied,
        SUM(LOWER(status) = 'pending') AS Pending,
        SUM(LOWER(status) = 'shortlisted') AS Shortlisted,
        SUM(LOWER(status) = 'rejected') AS Rejected
      FROM applications
      WHERE user_id = ?
    `;

    const [result] = await db.query(sql, [userId]);

    res.json({
      Applied: result[0].Applied || 0,
      Pending: result[0].Pending || 0,
      Shortlisted: result[0].Shortlisted || 0,
      Rejected: result[0].Rejected || 0,
    });
  } catch (err) {
    logger.error("getApplicationStats failed:", err);
    return res.status(500).json({ message: "Error fetching stats" });
  }
};

// GET PROFILE
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `
      SELECT 
        id,
        name,
        email,
        phone,
        city,
        qualification,
        role,
        status
      FROM users
      WHERE id = ? AND role = 'user'
      `,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    logger.error("getUserProfile error:", error);
    return res.status(500).json({ message: "Server error while fetching profile" });
  }
};

// UPDATE PROFILE
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, city, qualification } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email, userId]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const [result] = await db.query(
      `
      UPDATE users
      SET
        name = ?,
        email = ?,
        phone = ?,
        city = ?,
        qualification = ?
      WHERE id = ? AND role = 'user'
      `,
      [
        name,
        email,
        phone || null,
        city || null,
        qualification || null,
        userId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found or update failed" });
    }

    return res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    logger.error("updateUserProfile error:", error);
    return res.status(500).json({ message: "Server error while updating profile" });
  }
};