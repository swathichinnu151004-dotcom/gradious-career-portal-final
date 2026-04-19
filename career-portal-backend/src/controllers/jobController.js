const db = require("../config/connectDB");
const logger = require("../utils/logger");
const {
  onUserAppliedToJob,
  onApplicationStatusForUser,
} = require("../services/notificationService");

// CREATE JOB
exports.createJob = async (req, res) => {
  try {
    const recruiterId = req.user.id;

    const { job_title, department, location, experience, description, status } = req.body;

    const query = `
      INSERT INTO jobs (
        job_title,
        department,
        location,
        experience,
        description,
        recruiter_id,
        posted_date,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
    `;

    const [result] = await db.query(query, [
      job_title,
      department,
      location,
      experience,
      description,
      recruiterId,
      status || "ACTIVE"
    ]);

    res.status(201).json({
      message: "Job created successfully",
      jobId: result.insertId
    });

  } catch (error) {
    logger.error("createJob failed:", error);
    res.status(500).json({ message: error.message });
  }
};
// GET ALL JOBS (browse / apply — omits jobs this user already applied to)
exports.getAllJobs = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT j.id, j.job_title, j.department, j.location, j.experience, j.description,
              j.recruiter_id, j.posted_date, j.status
       FROM jobs j
       WHERE NOT EXISTS (
         SELECT 1 FROM applications a
         WHERE a.job_id = j.id AND a.user_id = ?
       )
       ORDER BY j.posted_date DESC`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    logger.error("getAllJobs failed:", error);
    res.status(500).json({ message: "Error fetching jobs" });
  }
};

// GET JOB BY ID
exports.getJobById = async (req, res) => {
  try {
    const jobId = req.params.id;

    const [rows] = await db.query(`
      SELECT * FROM jobs WHERE id = ?
    `, [jobId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(rows[0]);

  } catch (error) {
    logger.error("getJobById failed:", error);
    res.status(500).json({ message: "Error fetching job" });
  }
};

// APPLY JOB
exports.applyForJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.body;

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
    const [users] = await db.query(
      "SELECT id, name FROM users WHERE id = ? AND role = 'user'",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "Valid user not found" });
    }

    // Check job exists
    const [jobs] = await db.query(
      "SELECT id, job_title, recruiter_id FROM jobs WHERE id = ?",
      [jobId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ message: "Valid job not found" });
    }

    // Prevent duplicate application
    const [existingApplication] = await db.query(
      "SELECT id FROM applications WHERE user_id = ? AND job_id = ?",
      [userId, jobId]
    );

    if (existingApplication.length > 0) {
      return res.status(400).json({ message: "You already applied for this job" });
    }

    const resumePath = req.file.filename;

    const [insertApp] = await db.query(
      `INSERT INTO applications (user_id, job_id, resume, status, applied_date)
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, jobId, resumePath, "Applied"]
    );

    const applicationId = insertApp.insertId;
    const applicantName = users[0].name || "A candidate";
    const jobTitle = jobs[0].job_title;
    const recruiterId = jobs[0].recruiter_id;

    await onUserAppliedToJob({
      applicationId,
      applicantUserId: userId,
      applicantName,
      jobTitle,
      recruiterId,
    });

    return res.status(201).json({
      message: "Application submitted successfully"
    });
  } catch (error) {
    logger.error("Apply job error:", error);
    return res.status(500).json({ message: "Server error while applying for job" });
  }
};
exports.getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(`
      SELECT 
        applications.job_id,
        jobs.job_title,
        jobs.department,
        jobs.location,
        applications.applied_date,
        applications.status
      FROM applications
      JOIN jobs ON applications.job_id = jobs.id
      WHERE applications.user_id = ?
      ORDER BY applications.applied_date DESC
    `, [userId]);

    res.json(rows);

  } catch (error) {
    logger.error("Get my applications error:", error);
    res.status(500).json({ message: "Error fetching applications" });
  }
};
exports.searchJobs = async (req, res) => {
  try {
    const { skill, location } = req.query;

    let sql = `
      SELECT * FROM jobs WHERE status = 'ACTIVE'
    `;

    const values = [];

    if (skill) {
      sql += ` AND (job_title LIKE ? OR department LIKE ? OR description LIKE ?)`;
      values.push(`%${skill}%`, `%${skill}%`, `%${skill}%`);
    }

    if (location) {
      sql += ` AND location LIKE ?`;
      values.push(`%${location}%`);
    }

    sql += ` ORDER BY posted_date DESC`;

    const [rows] = await db.query(sql, values);

    res.json(rows);

  } catch (error) {
    logger.error("Search jobs error:", error);
    res.status(500).json({ message: "Error searching jobs" });
  }
};
/** SQL fragment: posted in the last 60 days (rolling), active openings only. `alias` e.g. "j" or "". */
function latestPostedJobsWhere(alias) {
  const a = alias ? `${alias}.` : "";
  return `${a}posted_date IS NOT NULL
    AND ${a}posted_date >= DATE_SUB(NOW(), INTERVAL 60 DAY)
    AND LOWER(TRIM(COALESCE(${a}status, ''))) = 'active'`;
}

exports.getLatestJobs = async (req, res) => {
  try {
    const userId = req.user?.id;

    // Authenticated: small widget list. Public home: up to 500 rows for expand/collapse.
    const [rows] = userId
      ? await db.query(
          `SELECT j.*
           FROM jobs j
           WHERE ${latestPostedJobsWhere("j")}
           AND NOT EXISTS (
             SELECT 1 FROM applications a
             WHERE a.job_id = j.id AND a.user_id = ?
           )
           ORDER BY j.posted_date DESC
           LIMIT 3`,
          [userId]
        )
      : await db.query(
          `SELECT *
           FROM jobs
           WHERE ${latestPostedJobsWhere("")}
           ORDER BY posted_date DESC
           LIMIT 500`
        );

    res.json(rows);
  } catch (error) {
    logger.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.checkApplicationStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const jobId = req.params.jobId;

    const [rows] = await db.query(
      "SELECT * FROM applications WHERE user_id = ? AND job_id = ?",
      [userId, jobId]
    );

    res.json({ applied: rows.length > 0 });

  } catch (error) {
    res.status(500).json({ message: "Database error" });
  }
};
exports.updateApplicationStatus = async (req, res) => {
  try {
    const applicationId = req.params.id;
    const { status } = req.body;

    const allowedStatuses = ["Pending", "Shortlisted", "Rejected"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const [appRows] = await db.query(
      `SELECT a.user_id, j.job_title
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.id = ?`,
      [applicationId]
    );

    if (appRows.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    await db.query(
      "UPDATE applications SET status = ? WHERE id = ?",
      [status, applicationId]
    );

    if (["Shortlisted", "Rejected"].includes(status)) {
      await onApplicationStatusForUser({
        userId: appRows[0].user_id,
        jobTitle: appRows[0].job_title,
        status,
        applicationId: Number(applicationId),
        senderId: req.user?.id ?? null,
      });
    }

    res.json({ message: "Status updated successfully" });

  } catch (error) {
    res.status(500).json({ message: "Database error" });
  }
};
exports.getDepartmentStats = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT department, COUNT(*) AS count
      FROM jobs
      GROUP BY department
    `);

    res.json(rows);

  } catch (error) {
    logger.error("Department Stats Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.getDepartmentCounts = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT department, COUNT(*) AS totalJobs
      FROM jobs
      WHERE status = 'ACTIVE'
      GROUP BY department
      ORDER BY totalJobs DESC, department ASC
    `);

    res.json(rows);
  } catch (error) {
    logger.error("Department counts error:", error);
    res.status(500).json({ message: "Failed to fetch department counts" });
  }
};