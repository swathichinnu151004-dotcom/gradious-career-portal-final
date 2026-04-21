const db = require("../config/connectDB");
const logger = require("../utils/logger");
const bcrypt = require("bcrypt");
const sendMail = require("../utils/sendMail");

/** JWT `id` must match `recruiters.id` (numeric). */
function recruiterIdFromRequest(req) {
  const raw = req.user?.id;
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const n = Number.parseInt(String(raw), 10);
  return Number.isFinite(n) ? n : null;
}
const { createNotification } = require("../utils/createNotification");
const {
  onRecruiterPostedJob,
  onApplicationStatusForUser,
} = require("../services/notificationService");
exports.getRecruiterDashboardSummary = async (req, res) => {
  try {
    const recruiterId = recruiterIdFromRequest(req);
    if (recruiterId == null) {
      return res.status(400).json({ message: "Invalid token" });
    }

    const totalJobsQuery = `
      SELECT COUNT(*) AS totalJobs
      FROM jobs
      WHERE recruiter_id = ?
    `;

    const activeJobsQuery = `
      SELECT COUNT(*) AS activeJobs
      FROM jobs
      WHERE recruiter_id = ? AND UPPER(status) = 'ACTIVE'
    `;

    const totalApplicationsQuery = `
      SELECT COUNT(*) AS totalApplications
      FROM applications
      JOIN jobs ON applications.job_id = jobs.id
      WHERE jobs.recruiter_id = ?
    `;

    const appliedQuery = `
      SELECT COUNT(*) AS appliedApplications
      FROM applications
      JOIN jobs ON applications.job_id = jobs.id
      WHERE jobs.recruiter_id = ? AND LOWER(applications.status) = 'applied'
    `;

    const shortlistedQuery = `
      SELECT COUNT(*) AS shortlistedApplications
      FROM applications
      JOIN jobs ON applications.job_id = jobs.id
      WHERE jobs.recruiter_id = ? AND LOWER(applications.status) = 'shortlisted'
    `;

    const rejectedQuery = `
      SELECT COUNT(*) AS rejectedApplications
      FROM applications
      JOIN jobs ON applications.job_id = jobs.id
      WHERE jobs.recruiter_id = ? AND LOWER(applications.status) = 'rejected'
    `;

    const p = [recruiterId];
    const [
      [result1],
      [result2],
      [result3],
      [result4],
      [result5],
      [result6],
    ] = await Promise.all([
      db.query(totalJobsQuery, p),
      db.query(activeJobsQuery, p),
      db.query(totalApplicationsQuery, p),
      db.query(appliedQuery, p),
      db.query(shortlistedQuery, p),
      db.query(rejectedQuery, p),
    ]);

    const summary = {
      totalJobs: result1[0]?.totalJobs || 0,
      activeJobs: result2[0]?.activeJobs || 0,
      totalApplications: result3[0]?.totalApplications || 0,
      appliedApplications: result4[0]?.appliedApplications || 0,
      shortlistedApplications: result5[0]?.shortlistedApplications || 0,
      rejectedApplications: result6[0]?.rejectedApplications || 0,
    };

    return res.json(summary);
  } catch (error) {
    logger.error("Error fetching recruiter dashboard summary:", error);
    return res.status(500).json({
      message: "Server error while fetching dashboard summary",
    });
  }
};
// Recruiter profile (legacy — routes use getRecruiterProfile / async updateProfile)
exports.getProfile = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const sql = `
    SELECT id, name, email, phone, city, qualification, role, status
    FROM users
    WHERE id = ? AND role = 'recruiter'
  `;
    const [result] = await db.query(sql, [recruiterId]);
    if (!result.length) {
      return res.status(404).json({ message: "Recruiter not found" });
    }
    return res.json(result[0]);
  } catch (err) {
    logger.error("getProfile error:", err);
    return res.status(500).json({ message: "Error fetching recruiter profile" });
  }
};

/** PUT /api/recruiter/profile — must use promise pool (callback style leaks connections). */
exports.updateProfile = async (req, res) => {
  try {
    const recruiterId = recruiterIdFromRequest(req);
    if (recruiterId == null) {
      return res.status(400).json({ message: "Invalid token" });
    }

    const { name, email, phone, company_name, location } = req.body || {};

    const nameV = name != null ? String(name).trim() : "";
    const emailV = email != null ? String(email).trim() : "";
    const phoneV = phone != null ? String(phone).trim() : "";
    const companyV =
      company_name != null ? String(company_name).trim() : "";
    const locationV = location != null ? String(location).trim() : "";

    if (!emailV) {
      return res.status(400).json({ message: "Email is required" });
    }

    const [dup] = await db.query(
      `SELECT id FROM recruiters WHERE LOWER(TRIM(email)) = LOWER(TRIM(?)) AND id <> ? LIMIT 1`,
      [emailV, recruiterId]
    );
    if (dup.length > 0) {
      return res.status(409).json({
        message: "That email is already used by another recruiter account.",
      });
    }

    const [result] = await db.query(
      `UPDATE recruiters
       SET name = ?, email = ?, phone = ?, company_name = ?, location = ?
       WHERE id = ?`,
      [nameV, emailV, phoneV, companyV, locationV, recruiterId]
    );

    if (result.affectedRows === 0) {
      const [exists] = await db.query(
        "SELECT id FROM recruiters WHERE id = ? LIMIT 1",
        [recruiterId]
      );
      if (!exists.length) {
        return res.status(404).json({ message: "Recruiter not found" });
      }
    }

    return res.json({ message: "Profile updated successfully" });
  } catch (err) {
    logger.error("updateProfile error:", err);
    if (err && err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "That email is already registered. Choose a different email.",
      });
    }
    return res.status(500).json({ message: "Error updating recruiter profile" });
  }
};

// Recruiter jobs
exports.getRecruiterJobs = async (req, res) => {
  try {
    const recruiterId = req.user.id;

    const query = `
      SELECT 
        id,
        job_title,
        department,
        location,
        experience,
        description,
        status,
        posted_date
      FROM jobs
      WHERE recruiter_id = ?
      ORDER BY id DESC
    `;

    const [jobs] = await db.query(query, [recruiterId]);

    res.status(200).json(jobs);
  } catch (error) {
    logger.error("Get recruiter jobs error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.getRecruiterJobById = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const jobId = req.params.id;
    const sql = `
    SELECT *
    FROM jobs
    WHERE id = ? AND recruiter_id = ?
  `;
    const [result] = await db.query(sql, [jobId, recruiterId]);
    if (!result.length) {
      return res.status(404).json({ message: "Job not found" });
    }
    return res.json(result[0]);
  } catch (err) {
    logger.error("getRecruiterJobById error:", err);
    return res.status(500).json({ message: "Error fetching job details" });
  }
};
exports.createJob = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized. Invalid or expired token." });
    }

    const recruiterId = req.user.id;

    const { job_title, department, location, experience, description, status } = req.body;

    if (!job_title || !department || !location || !experience || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const jt = String(job_title).trim();
    const dept = String(department).trim();
    const loc = String(location).trim();
    const exp = String(experience).trim();
    const desc = String(description).trim();
    const jobStatus = (status || "ACTIVE").toString().trim() || "ACTIVE";

    const titleKey = jt.toLowerCase();
    const deptKey = dept.toLowerCase();
    const locKey = loc.toLowerCase();
    const expKey = exp.toLowerCase();

    const [dupes] = await db.query(
      `SELECT id FROM jobs
       WHERE recruiter_id = ?
         AND LOWER(TRIM(job_title)) = ?
         AND LOWER(TRIM(department)) = ?
         AND LOWER(TRIM(location)) = ?
         AND LOWER(TRIM(COALESCE(experience, ''))) = ?
         AND LOWER(TRIM(COALESCE(status, ''))) = 'active'
       LIMIT 1`,
      [recruiterId, titleKey, deptKey, locKey, expKey]
    );

    if (dupes.length > 0) {
      return res.status(409).json({
        message:
          "You already have an active listing with the same job title, department, location, and experience. Edit or close that job before posting again.",
      });
    }

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
      jt,
      dept,
      loc,
      exp,
      desc,
      recruiterId,
      jobStatus
    ]);

    await onRecruiterPostedJob({
      recruiterId,
      jobId: result.insertId,
      jobTitle: jt,
    });

    res.status(201).json({
      message: "Job created successfully",
      jobId: result.insertId
    });

  } catch (error) {
    logger.error("Create job error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};
exports.updateJob = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const jobId = req.params.id;

    const { job_title, department, location, experience, description, status } = req.body;

    const query = `
      UPDATE jobs
      SET
        job_title = ?,
        department = ?,
        location = ?,
        experience = ?,
        description = ?,
        status = ?
      WHERE id = ? AND recruiter_id = ?
    `;

    const [result] = await db.query(query, [
      job_title,
      department,
      location,
      experience,
      description,
      status,
      jobId,
      recruiterId
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Job not found or unauthorized" });
    }

    await createNotification({
      userId: recruiterId,
      role: "recruiter",
      title: "Job Updated",
      message: `Your job "${job_title}" was updated successfully`,
      type: "job",
      relatedId: jobId,
    });

    res.status(200).json({ message: "Job updated successfully" });
  } catch (error) {
    logger.error("Update job error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.deleteJob = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const jobId = req.params.id;

    const [jobRows] = await db.query(
      `SELECT job_title FROM jobs WHERE id = ? AND recruiter_id = ?`,
      [jobId, recruiterId]
    );

    if (jobRows.length === 0) {
      return res.status(404).json({ message: "Job not found or unauthorized" });
    }

    const jobTitle = jobRows[0].job_title;

    await db.query(
      "DELETE FROM jobs WHERE id = ? AND recruiter_id = ?",
      [jobId, recruiterId]
    );

    await createNotification({
      userId: recruiterId,
      role: "recruiter",
      title: "Job Deleted",
      message: `Your job "${jobTitle}" was deleted successfully`,
      type: "job",
      relatedId: jobId,
    });

    res.json({ message: "Job deleted successfully" });

  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Error deleting job" });
  }
};
// Recruiter applications
exports.getApplications = async (req, res) => {
  try {
    const recruiterId = req.user.id;

    const [results] = await db.query(
      `
      SELECT 
        a.id,
        a.status,
        a.applied_date,
        u.name AS applicant_name,
        u.email,
        u.phone,
        j.job_title,
        j.department,
        j.location,
        j.experience,
        a.resume
      FROM applications a
      INNER JOIN users u ON a.user_id = u.id
      INNER JOIN jobs j ON a.job_id = j.id
      WHERE j.recruiter_id = ?
      ORDER BY a.applied_date DESC
      `,
      [recruiterId]
    );

    return res.status(200).json(results);
  } catch (error) {
    logger.error("Error fetching recruiter applications:", error);
    return res.status(500).json({ message: "Failed to fetch recruiter applications" });
  }
};
exports.getApplicationById = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const applicationId = req.params.id;
    const sql = `
    SELECT 
      applications.id,
      applications.user_id,
      applications.job_id,
      applications.status,
      applications.applied_date,
      users.name AS user_name,
      users.email AS user_email,
      jobs.job_title
    FROM applications
    JOIN users ON applications.user_id = users.id
    JOIN jobs ON applications.job_id = jobs.id
    WHERE applications.id = ? AND jobs.recruiter_id = ?
  `;
    const [result] = await db.query(sql, [applicationId, recruiterId]);
    if (!result.length) {
      return res.status(404).json({ message: "Application not found" });
    }
    return res.json(result[0]);
  } catch (err) {
    logger.error("getApplicationById error:", err);
    return res.status(500).json({ message: "Error fetching application details" });
  }
};
exports.updateApplicationStatus = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const applicationId = req.params.id;
    const { status } = req.body;

    if (!["Shortlisted", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

   const [rows] = await db.query(
  `
  SELECT 
  a.id,
  a.user_id,
  a.status AS current_status,
  u.name AS applicant_name,
  u.email AS applicant_email,
  j.job_title,
  j.department,
  j.location,
  j.experience
  FROM applications a
  INNER JOIN users u ON a.user_id = u.id
  INNER JOIN jobs j ON a.job_id = j.id
  WHERE a.id = ? AND j.recruiter_id = ?
  `,
  [applicationId, recruiterId]
);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    const application = rows[0];

    if (application.current_status === status) {
      return res.status(400).json({
        message: `Application already ${status.toLowerCase()}`,
      });
    }

    await db.query(
      `UPDATE applications SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, applicationId]
    );

    await onApplicationStatusForUser({
      userId: application.user_id,
      jobTitle: application.job_title,
      status,
      applicationId,
      senderId: recruiterId,
    });

    // Email content
    let subject = "";
    let text = "";
    let html = "";

    if (status === "Shortlisted") {
      subject = "Application Update – Shortlisted";

      text = `Dear ${application.applicant_name},

We are pleased to inform you that your application for the position of ${application.job_title} has been shortlisted.

Our recruitment team will review your profile further and contact you with the next steps shortly.

Please keep an eye on your email for further communication.

Regards,
Recruitment Team
Gradious Careers Portal

This is an automated email. Please do not reply.
For support, contact: gradiousrecruitment@gmail.com`;

      html = `
        <div style="font-family: Arial, sans-serif; background:#f4f6f9; padding:24px;">
          <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 14px rgba(0,0,0,0.08);">

            <div style="background:#0f3d91; color:#ffffff; padding:16px 24px; font-size:20px; font-weight:bold;">
              Gradious Careers Portal
            </div>

            <div style="padding:24px; color:#1f2937; line-height:1.7;">
              <p style="margin:0 0 16px;">Dear <strong>${application.applicant_name}</strong>,</p>

              <p style="margin:0 0 16px;">
                We are pleased to inform you that your application for the position of
                <strong>${application.job_title}</strong> has been
                <span style="color:#15803d; font-weight:bold;">shortlisted</span>.
              </p>

              <p style="margin:0 0 16px;">
                Our recruitment team will review your profile further and contact you with the next steps shortly.
              </p>

              <p style="margin:0 0 16px;">
                Please keep an eye on your email for further communication.
              </p>

              <p style="margin:24px 0 0;">
                Regards,<br/>
                <strong>Recruitment Team</strong><br/>
                Gradious Careers Portal
              </p>
            </div>

            <div style="background:#f8fafc; padding:14px 24px; font-size:12px; color:#6b7280; border-top:1px solid #e5e7eb;">
              This is an automated email. Please do not reply.<br/>
              For support, contact: gradiousrecruitment@gmail.com
            </div>
          </div>
        </div>
      `;
    } else if (status === "Rejected") {
      subject = "Application Update – Not Selected";

      text = `Dear ${application.applicant_name},

Thank you for applying for the position of ${application.job_title}.

After carefully reviewing your profile, we regret to inform you that you were not selected for this opportunity.

We sincerely appreciate your interest in Gradious Careers Portal and encourage you to apply for future openings that match your profile.

Regards,
Recruitment Team
Gradious Careers Portal

This is an automated email. Please do not reply.
For support, contact: gradiousrecruitment@gmail.com`;

      html = `
        <div style="font-family: Arial, sans-serif; background:#f4f6f9; padding:24px;">
          <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 14px rgba(0,0,0,0.08);">

            <div style="background:#0f3d91; color:#ffffff; padding:16px 24px; font-size:20px; font-weight:bold;">
              Gradious Careers Portal
            </div>

            <div style="padding:24px; color:#1f2937; line-height:1.7;">
              <p style="margin:0 0 16px;">Dear <strong>${application.applicant_name}</strong>,</p>

              <p style="margin:0 0 16px;">
                Thank you for applying for the position of
                <strong>${application.job_title}</strong>.
              </p>

              <p style="margin:0 0 16px;">
                After carefully reviewing your profile, we regret to inform you that you were
                <span style="color:#dc2626; font-weight:bold;">not selected</span> for this opportunity.
              </p>

              <p style="margin:0 0 16px;">
                We sincerely appreciate your interest in Gradious Careers Portal and encourage you to apply for future openings that match your profile.
              </p>

              <p style="margin:24px 0 0;">
                Regards,<br/>
                <strong>Recruitment Team</strong><br/>
                Gradious Careers Portal
              </p>
            </div>

            <div style="background:#f8fafc; padding:14px 24px; font-size:12px; color:#6b7280; border-top:1px solid #e5e7eb;">
              This is an automated email. Please do not reply.<br/>
              For support, contact: gradiousrecruitment@gmail.com
            </div>
          </div>
        </div>
      `;
    }

    // Send email
    try {
      await sendMail({
        to: application.applicant_email,
        subject,
        text,
        html,
      });

      return res.status(200).json({
        message: `Application ${status.toLowerCase()} successfully and email sent`,
      });
    } catch (mailError) {
      logger.error("Mail send error:", mailError);

      return res.status(200).json({
        message: `Application ${status.toLowerCase()} successfully, but email could not be sent`,
      });
    }
  } catch (error) {
    logger.error("Error updating application status:", error);
    return res.status(500).json({
      message: "Failed to update application status",
    });
  }
};
// ===============================
// Validate recruiter invite token
// ===============================
exports.validateInviteToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }
    const sql = `
    SELECT * FROM recruiter_invites
    WHERE token = ? AND status = 'Pending'
  `;
    const [results] = await db.query(sql, [token]);
    if (results.length === 0) {
      return res.status(400).json({ message: "Invalid or expired invite token" });
    }
    return res.status(200).json({
      message: "Valid invite token",
      email: results[0].email,
    });
  } catch (err) {
    logger.error("Validate invite token error:", err);
    return res.status(500).json({ message: "Database error" });
  }
};
// ===============================
// Complete recruiter signup
// ===============================

exports.completeRecruiterSignup = async (req, res) => {
  try {
    const { token, name, password, company_name, phone, location } = req.body;

    if (!token || !name || !password || !company_name || !phone || !location) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [inviteResults] = await db.query(
      "SELECT * FROM recruiter_invites WHERE token = ? AND status = 'Pending'",
      [token]
    );

    if (inviteResults.length === 0) {
      return res.status(400).json({ message: "Invalid or expired invite token" });
    }

    const invitedEmail = inviteResults[0].email;
    const hashedPassword = await bcrypt.hash(password, 10);

    const [recruiterResults] = await db.query(
      "SELECT * FROM recruiters WHERE email = ?",
      [invitedEmail]
    );

    if (recruiterResults.length > 0) {
      await db.query(
        `UPDATE recruiters
         SET name = ?, password = ?, company_name = ?, phone = ?, location = ?, status = 'Active'
         WHERE email = ?`,
        [name, hashedPassword, company_name, phone, location, invitedEmail]
      );
    } else {
      await db.query(
        `INSERT INTO recruiters
        (name, email, password, company_name, phone, location, role, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'recruiter', 'Active', NOW())`,
        [name, invitedEmail, hashedPassword, company_name, phone, location]
      );
    }

    await db.query(
      "UPDATE recruiter_invites SET status = 'Accepted' WHERE token = ?",
      [token]
    );

    return res.status(201).json({
      message: "Recruiter signup completed successfully"
    });
  } catch (error) {
    logger.error("Complete recruiter signup error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.getRecruiterProfile = async (req, res) => {
  const started = Date.now();
  try {
    const idParam = recruiterIdFromRequest(req);
    if (idParam == null) {
      logger.warn("getRecruiterProfile: missing recruiter id in token");
      return res.status(400).json({ message: "Invalid token" });
    }

    const [rows] = await db.query(
      `SELECT 
        id,
        name,
        email,
        phone,
        company_name,
        location,
        status
       FROM recruiters
       WHERE id = ?`,
      [idParam]
    );

    const elapsed = Date.now() - started;
    if (elapsed > 1500) {
      logger.warn("getRecruiterProfile: slow response", {
        recruiterId: idParam,
        ms: elapsed,
      });
    }

    if (!rows || rows.length === 0) {
      logger.warn("getRecruiterProfile: recruiter not found", { recruiterId: idParam });

      return res.status(404).json({
        message: "Recruiter not found",
        recruiterId: idParam,
      });
    }

    return res.status(200).json(rows[0]);

  } catch (error) {
    logger.error("getRecruiterProfile failed:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};