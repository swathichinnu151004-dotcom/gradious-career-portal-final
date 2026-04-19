const db = require("../config/connectDB");
const logger = require("../utils/logger");
const crypto = require("crypto");
const sendEmail = require("../utils/sendMail");
const { onApplicationStatusForUser } = require("../services/notificationService");

exports.resendInvite = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Invite id is required" });
    }

    const [rows] = await db.query(
      "SELECT * FROM recruiter_invites WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Invite not found" });
    }

    const invite = rows[0];

    const newToken = crypto.randomBytes(32).toString("hex");
    const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.query(
      `UPDATE recruiter_invites
       SET token = ?, status = 'Pending', expires_at = ?, created_at = NOW()
       WHERE id = ?`,
      [newToken, newExpiry, id]
    );

    const inviteLink = `${process.env.FRONTEND_URL}/recruiter-signup?token=${newToken}`;

    await sendEmail({
      to: invite.email,
      subject: "Recruiter Invitation - Gradious Careers Portal",
      html: `
        <h2>Recruiter Invitation</h2>
        <p>You have been invited as a recruiter.</p>
        <a href="${inviteLink}">Complete Signup</a>
      `
    });

    return res.status(200).json({ message: "Invite resent successfully" });
  } catch (error) {
    logger.error("Resend invite error:", error);
    return res.status(500).json({ message: "Server error while resending invite" });
  }
};
// POST /api/admin/invite-recruiter

exports.inviteRecruiter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Recruiter email is required" });
    }

    const recruiterEmail = email.trim().toLowerCase();

    const [existingRecruiter] = await db.query(
      "SELECT id FROM recruiters WHERE email = ?",
      [recruiterEmail]
    );

    if (existingRecruiter.length > 0) {
      return res.status(400).json({ message: "Recruiter already exists" });
    }

    const [existingInvite] = await db.query(
      "SELECT id, status FROM recruiter_invites WHERE email = ?",
      [recruiterEmail]
    );

    if (existingInvite.length > 0) {
      return res.status(400).json({
        message: "Invite already exists for this email"
      });
    }

    const token = require("crypto").randomBytes(32).toString("hex");

    await db.query(
      `INSERT INTO recruiter_invites (email, token, status, expires_at)
       VALUES (?, ?, 'Pending', DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
      [recruiterEmail, token]
    );

    const inviteLink = `${process.env.FRONTEND_URL}/recruiter-signup?token=${token}`;

    await sendEmail({
      to: recruiterEmail,
      subject: "Recruiter Invitation - Gradious Careers Portal",
      html: `
        <h2>Recruiter Invitation</h2>
        <p>You have been invited as a recruiter.</p>
        <a href="${inviteLink}">Complete Signup</a>
      `
    });

    return res.status(200).json({
      message: "Recruiter invite sent successfully"
    });
  } catch (error) {
    logger.error("Invite recruiter error:", error);
    return res.status(500).json({
      message: error.message || "Error sending invite"
    });
  }
};
exports.cancelInvite = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Invite id is required" });
    }

    const [result] = await db.query(
      `DELETE FROM recruiter_invites WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Invite not found" });
    }

    return res.status(200).json({
      message: "Invite cancelled successfully"
    });
  } catch (error) {
    logger.error("Cancel invite error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/admin/recruiter-invites
exports.getRecruiterInvites = async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT id, email, status, created_at
      FROM recruiter_invites
      ORDER BY created_at DESC
    `);

    return res.status(200).json(results);
  } catch (error) {
    logger.error("Fetch invites error:", error);
    return res.status(500).json({ message: "Error fetching recruiter invites" });
  }
};

// Dashboard summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT COUNT(*) AS totalUsers FROM users WHERE role = 'user'"
    );

    const [recruiters] = await db.query(
      "SELECT COUNT(*) AS totalRecruiters FROM recruiters"
    );

    const [jobs] = await db.query(
      "SELECT COUNT(*) AS totalJobs FROM jobs"
    );

    const [applications] = await db.query(
      "SELECT COUNT(*) AS totalApplications FROM applications"
    );

    const [activeJobsRows] = await db.query(
      "SELECT COUNT(*) AS activeJobs FROM jobs WHERE LOWER(status) = 'active'"
    );

    const [inactiveJobsRows] = await db.query(
      "SELECT COUNT(*) AS inactiveJobs FROM jobs WHERE LOWER(status) = 'inactive'"
    );

    const [appliedRows] = await db.query(
      "SELECT COUNT(*) AS appliedCount FROM applications WHERE LOWER(status) = 'applied'"
    );

    const [shortlistedRows] = await db.query(
      "SELECT COUNT(*) AS shortlistedCount FROM applications WHERE LOWER(status) = 'shortlisted'"
    );

    const [rejectedRows] = await db.query(
      "SELECT COUNT(*) AS rejectedCount FROM applications WHERE LOWER(status) = 'rejected'"
    );

    const [pendingRows] = await db.query(
      "SELECT COUNT(*) AS pendingCount FROM applications WHERE LOWER(status) = 'pending'"
    );

    return res.status(200).json({
      totalUsers: users[0].totalUsers || 0,
      totalRecruiters: recruiters[0].totalRecruiters || 0,
      totalJobs: jobs[0].totalJobs || 0,
      totalApplications: applications[0].totalApplications || 0,
      activeJobs: activeJobsRows[0].activeJobs || 0,
      inactiveJobs: inactiveJobsRows[0].inactiveJobs || 0,
      appliedCount: appliedRows[0].appliedCount || 0,
      shortlistedCount: shortlistedRows[0].shortlistedCount || 0,
      rejectedCount: rejectedRows[0].rejectedCount || 0,
      pendingCount: pendingRows[0].pendingCount || 0
    });
  } catch (error) {
    logger.error("Dashboard summary error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
// Users
exports.getAllUsers = async (req, res) => {
  try {
    const [result] = await db.query(`
      SELECT id, name, email, phone, city, qualification, role, status
      FROM users
      WHERE role = 'user'
    `);

    return res.json(result);
  } catch (err) {
    logger.error("Get all users error:", err);
    return res.status(500).json({ message: "Error fetching users" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const [result] = await db.query(`
      SELECT id, name, email, phone, city, qualification, role, status
      FROM users
      WHERE id = ?
    `, [userId]);

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(result[0]);
  } catch (err) {
    logger.error("Get user by id error:", err);
    return res.status(500).json({ message: "Error fetching user details" });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { status } = req.body;

    await db.query(
      "UPDATE users SET status = ? WHERE id = ?",
      [status, userId]
    );

    return res.json({ message: "User status updated successfully" });
  } catch (err) {
    logger.error("Update user status error:", err);
    return res.status(500).json({ message: "Error updating user status" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    await db.query(
      "DELETE FROM users WHERE id = ?",
      [userId]
    );

    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    logger.error("Delete user error:", err);
    return res.status(500).json({ message: "Error deleting user" });
  }
};

// Recruiters
exports.getAllRecruiters = async (req, res) => {
  try {
    const [result] = await db.query(`
      SELECT id, name, email, company_name, phone, location, role, status
      FROM recruiters
    `);

    return res.json(result);
  } catch (err) {
    logger.error("Get all recruiters error:", err);
    return res.status(500).json({ message: "Error fetching recruiters" });
  }
};

exports.getRecruiterById = async (req, res) => {
  try {
    const recruiterId = req.params.id;

    const [result] = await db.query(
      `SELECT id, name, email, company_name, phone, location, role, status
       FROM recruiters
       WHERE id = ?`,
      [recruiterId]
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    return res.json(result[0]);
  } catch (err) {
    logger.error("Get recruiter by id error:", err);
    return res.status(500).json({ message: "Error fetching recruiter details" });
  }
};

exports.updateRecruiterStatus = async (req, res) => {
  try {
    const recruiterId = req.params.id;
    const { status } = req.body;

    const [result] = await db.query(
      "UPDATE recruiters SET status = ? WHERE id = ?",
      [status, recruiterId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    return res.json({ message: "Recruiter status updated successfully" });
  } catch (err) {
    logger.error("Update recruiter status error:", err);
    return res.status(500).json({ message: "Error updating recruiter status" });
  }
};
exports.deleteRecruiter = async (req, res) => {
  try {
    const recruiterId = req.params.id;

    const [result] = await db.query(
      "DELETE FROM recruiters WHERE id = ?",
      [recruiterId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    return res.json({ message: "Recruiter deleted successfully" });
  } catch (err) {
    logger.error("Delete recruiter error:", err);
    return res.status(500).json({ message: "Error deleting recruiter" });
  }
};

// Jobs
exports.getAllJobsForAdmin = async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT * FROM jobs ORDER BY posted_date DESC"
    );

    return res.json(results);
  } catch (err) {
    logger.error("Get all jobs for admin error:", err);
    return res.status(500).json({ message: "Error fetching jobs" });
  }
};

exports.getJobByIdForAdmin = async (req, res) => {
  try {
    const jobId = req.params.id;

    const [results] = await db.query(
      "SELECT * FROM jobs WHERE id = ?",
      [jobId]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.json(results[0]);
  } catch (err) {
    logger.error("Get job by id for admin error:", err);
    return res.status(500).json({ message: "Error fetching job details" });
  }
};

exports.updateJobByAdmin = async (req, res) => {
  try {
    const jobId = req.params.id;
    const { job_title, department, location, experience, description, status } = req.body;

    await db.query(
      `UPDATE jobs
       SET job_title = ?, department = ?, location = ?, experience = ?, description = ?, status = ?
       WHERE id = ?`,
      [job_title, department, location, experience, description, status, jobId]
    );

    return res.json({ message: "Job updated successfully" });
  } catch (err) {
    logger.error("Update job by admin error:", err);
    return res.status(500).json({ message: "Error updating job" });
  }
};

exports.deleteJobByAdmin = async (req, res) => {
  try {
    const jobId = req.params.id;

    await db.query(
      "DELETE FROM jobs WHERE id = ?",
      [jobId]
    );

    return res.json({ message: "Job deleted successfully" });
  } catch (err) {
    logger.error("Delete job by admin error:", err);
    return res.status(500).json({ message: "Error deleting job" });
  }
};

exports.getLatestJobs = async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT id, job_title, department, location, experience, status
      FROM jobs
      ORDER BY posted_date DESC
      LIMIT 5
    `);

    return res.json(results);
  } catch (err) {
    logger.error("Error fetching latest jobs:", err);
    return res.status(500).json({ message: "Error fetching latest jobs" });
  }
};

// Applications
exports.getAllApplications = async (req, res) => {
  try {
    const query = `
      SELECT
        a.id,
        u.name AS applicant_name,
        j.job_title,
        a.applied_date,
        a.status
      FROM applications a
      INNER JOIN users u ON a.user_id = u.id
      INNER JOIN jobs j ON a.job_id = j.id
      ORDER BY a.applied_date DESC
    `;

    const [rows] = await db.query(query);
    res.json(rows);
  } catch (error) {
    logger.error("getAllApplications error:", error);
    res.status(500).json({ message: "Error fetching applications" });
  }
};
exports.getApplicationById = async (req, res) => {
  try {
    const applicationId = req.params.id;

    const [results] = await db.query(`
      SELECT 
        applications.id,
        users.name,
        users.email,
        jobs.job_title,
        applications.status,
        applications.applied_date
      FROM applications
      JOIN users ON applications.user_id = users.id
      JOIN jobs ON applications.job_id = jobs.id
      WHERE applications.id = ?
    `, [applicationId]);

    if (results.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    return res.json(results[0]);
  } catch (err) {
    logger.error("Get application by id error:", err);
    return res.status(500).json({ message: "Error fetching application details" });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const allowedStatuses = ["Shortlisted", "Rejected"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value. Only Shortlisted or Rejected is allowed."
      });
    }

    const [rows] = await db.query(
      `SELECT a.id, a.user_id, a.job_id, a.status, j.job_title
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    let currentStatus = rows[0].status || "Applied";
    currentStatus = String(currentStatus).trim();

    if (currentStatus.toLowerCase() === "pending") {
      currentStatus = "Applied";
    } else if (currentStatus.toLowerCase() === "applied") {
      currentStatus = "Applied";
    } else if (currentStatus.toLowerCase() === "shortlisted") {
      currentStatus = "Shortlisted";
    } else if (currentStatus.toLowerCase() === "rejected") {
      currentStatus = "Rejected";
    }

    if (currentStatus === "Rejected") {
      return res.status(400).json({
        success: false,
        message: "Rejected application cannot be changed"
      });
    }

    if (currentStatus === status) {
      return res.status(400).json({
        success: false,
        message: `Application is already ${status}`
      });
    }

    const validTransitions = {
      Applied: ["Shortlisted", "Rejected"],
      Shortlisted: ["Rejected"]
    };

    if (
      !validTransitions[currentStatus] ||
      !validTransitions[currentStatus].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: `Invalid status change from ${currentStatus} to ${status}`
      });
    }

    await db.query(
      "UPDATE applications SET status = ? WHERE id = ?",
      [status, id]
    );

    await onApplicationStatusForUser({
      userId: rows[0].user_id,
      jobTitle: rows[0].job_title,
      status,
      applicationId: Number(id),
      senderId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: `Application status updated to ${status} successfully`
    });
  } catch (error) {
    logger.error("Error updating application status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
exports.deleteInvite = async (req, res) => {
  try {
    const inviteId = req.params.id;

    const [result] = await db.query(
      "DELETE FROM recruiter_invites WHERE id = ?",
      [inviteId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Invite not found" });
    }

    return res.status(200).json({
      message: "Invite deleted successfully"
    });

  } catch (error) {
    logger.error("Delete invite error:", error);
    return res.status(500).json({
      message: "Error deleting invite"
    });
  }
};

exports.getAdminProfile = async (req, res) => {
  try {

    const adminId = req.user?.id;


    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sql = `
      SELECT id, name, email, phone, city, qualification, status
      FROM users
      WHERE id = ? AND role = 'admin'
    `;

    const [rows] = await db.query(sql, [adminId]);


    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    logger.error("getAdminProfile error =>", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
exports.updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const { name, email, phone, city, qualification } = req.body;

    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sql = `
      UPDATE users
      SET name = ?, email = ?, phone = ?, city = ?, qualification = ?
      WHERE id = ? AND role = 'admin'
    `;

    const [result] = await db.query(sql, [
      name,
      email,
      phone,
      city,
      qualification,
      adminId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
    });
  } catch (error) {
    logger.error("updateAdminProfile error =>", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};