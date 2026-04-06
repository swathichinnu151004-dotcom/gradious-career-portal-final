const db = require("../config/connectDB");

exports.getRecruiterDashboardSummary = async (req, res) => {
  try {
    const recruiterId = req.user.id;

    const totalJobsQuery = `
      SELECT COUNT(*) AS totalJobs
      FROM jobs
      WHERE recruiter_id = ?
    `;

    const activeJobsQuery = `
      SELECT COUNT(*) AS activeJobs
      FROM jobs
      WHERE recruiter_id = ? AND status = 'ACTIVE'
    `;

    const totalApplicationsQuery = `
      SELECT COUNT(*) AS totalApplications
      FROM applications
      JOIN jobs ON applications.job_id = jobs.id
      WHERE jobs.recruiter_id = ?
    `;

    const shortlistedQuery = `
      SELECT COUNT(*) AS shortlistedApplications
      FROM applications
      JOIN jobs ON applications.job_id = jobs.id
      WHERE jobs.recruiter_id = ? AND applications.status = 'Shortlisted'
    `;

    const [result1] = await db.query(totalJobsQuery, [recruiterId]);
    const [result2] = await db.query(activeJobsQuery, [recruiterId]);
    const [result3] = await db.query(totalApplicationsQuery, [recruiterId]);
    const [result4] = await db.query(shortlistedQuery, [recruiterId]);

    const summary = {
      totalJobs: result1[0]?.totalJobs || 0,
      activeJobs: result2[0]?.activeJobs || 0,
      totalApplications: result3[0]?.totalApplications || 0,
      shortlistedApplications: result4[0]?.shortlistedApplications || 0
    };

    return res.json(summary);
  } catch (error) {
    console.error("Error fetching recruiter dashboard summary:", error);
    return res.status(500).json({
      message: "Server error while fetching dashboard summary"
    });
  }
};
// Recruiter profile
exports.getProfile = (req, res) => {
  const recruiterId = req.user.id;

  const sql = `
    SELECT id, name, email, phone, city, qualification, role, status
    FROM users
    WHERE id = ? AND role = 'recruiter'
  `;

  db.query(sql, [recruiterId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching recruiter profile" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    res.json(result[0]);
  });
};

exports.updateProfile = (req, res) => {
  const recruiterId = req.user.id;
  const { name, phone, city, qualification } = req.body;

  const sql = `
    UPDATE users
    SET name = ?, phone = ?, city = ?, qualification = ?
    WHERE id = ? AND role = 'recruiter'
  `;

  db.query(sql, [name, phone, city, qualification, recruiterId], (err) => {
    if (err) {
      return res.status(500).json({ message: "Error updating recruiter profile" });
    }

    res.json({ message: "Profile updated successfully" });
  });
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
    console.error("Get recruiter jobs error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.getRecruiterJobById = (req, res) => {
  const recruiterId = req.user.id;
  const jobId = req.params.id;

  const sql = `
    SELECT *
    FROM jobs
    WHERE id = ? AND recruiter_id = ?
  `;

  db.query(sql, [jobId, recruiterId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching job details" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(result[0]);
  });
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
    console.error("Create job error:", error);
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

    res.status(200).json({ message: "Job updated successfully" });
  } catch (error) {
    console.error("Update job error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.deleteJob = async (req, res) => {
  try {
    const jobId = req.params.id;

    await db.query("DELETE FROM jobs WHERE id = ?", [jobId]);

    res.json({ message: "Job deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting job" });
  }
};

// Recruiter applications
exports.getApplications = async (req, res) => {
  try {
    const recruiterId = req.user.id;

    const query = `
      SELECT 
        a.id,
        a.status,
        a.applied_date,
        u.name AS applicant_name,
        u.email AS applicant_email,
        j.job_title
      FROM applications a
      INNER JOIN jobs j ON a.job_id = j.id
      INNER JOIN users u ON a.user_id = u.id
      WHERE j.recruiter_id = ?
      ORDER BY a.applied_date DESC
    `;

    const [results] = await db.query(query, [recruiterId]);

    return res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching recruiter applications:", error);
    return res.status(500).json({ message: "Failed to fetch recruiter applications" });
  }
};
exports.getApplicationById = (req, res) => {
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

  db.query(sql, [applicationId, recruiterId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching application details" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json(result[0]);
  });
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const applicationId = req.params.id;
    let { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    status = String(status).trim().toLowerCase();

    const statusMap = {
      applied: "Applied",
      pending: "Pending",
      shortlisted: "Shortlisted",
      rejected: "Rejected"
    };

    if (!statusMap[status]) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const finalStatus = statusMap[status];

    const checkQuery = `
      SELECT a.id, a.status, a.user_id
      FROM applications a
      INNER JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ? AND j.recruiter_id = ?
    `;

    const [rows] = await db.query(checkQuery, [applicationId, recruiterId]);

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Application not found or not authorized to update"
      });
    }

    const currentStatus = rows[0].status;
    const applicationUserId = rows[0].user_id;

    const updateQuery = `
      UPDATE applications
      SET status = ?
      WHERE id = ?
    `;

    await db.query(updateQuery, [finalStatus, applicationId]);

    if (finalStatus === "Shortlisted" || finalStatus === "Rejected") {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          applicationUserId,
          "Application Status Updated",
          finalStatus === "Shortlisted"
            ? "Congratulations! You have been shortlisted for the job."
            : "Your application has been rejected.",
          finalStatus === "Shortlisted" ? "success" : "error",
          0
        ]
      );
    }

    return res.status(200).json({
      message: "Application status updated successfully",
      oldStatus: currentStatus,
      newStatus: finalStatus
    });
  } catch (error) {
    console.error("Update application status error:", error);
    return res.status(500).json({
      message: "Failed to update application status"
    });
  }
};
// ===============================
// Validate recruiter invite token
// ===============================
exports.validateInviteToken = (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({
      message: "Token is required"
    });
  }

  const sql = "SELECT id, email, status, token FROM recruiter_invites WHERE token = ?";

  db.query(sql, [token], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: "Server error while validating invite link"
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Invalid invite link"
      });
    }

    const invite = rows[0];

    if (invite.status !== "Pending") {
      return res.status(400).json({
        message: "Invite link is already used or expired"
      });
    }

    return res.status(200).json({
      message: "Invite link is valid",
      email: invite.email
    });
  });
};
// ===============================
// Complete recruiter signup
// ===============================
exports.completeRecruiterSignup = async (req, res) => {
  const { token, name, phone, password, company_name, location } = req.body;

  try {
    console.log("STEP 1 - Incoming token:", token);

    if (!token || !name || !phone || !password) {
      console.log("STEP 2 - Missing required fields");
      return res.status(400).json({
        message: "Token, name, phone and password are required"
      });
    }

    const [inviteRows] = await db.query(
      "SELECT * FROM recruiter_invites WHERE token = ?",
      [token]
    );

    console.log("STEP 3 - Invite rows found:", inviteRows.length);

    if (inviteRows.length === 0) {
      console.log("STEP 4 - Invalid token, no invite found");
      return res.status(400).json({
        message: "Invalid or expired invite link"
      });
    }

    const invite = inviteRows[0];
    const email = invite.email;

    console.log("STEP 5 - Invite row:", invite);

    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    console.log("STEP 6 - Existing users found:", existingUser.length);

    if (existingUser.length > 0) {
      console.log("STEP 7 - User already exists, updating invite to Accepted");

      const [updateResult] = await db.query(
        "UPDATE recruiter_invites SET status = 'Accepted' WHERE email = ?",
        [email]
      );

      console.log("STEP 8 - Update result:", updateResult);

      return res.status(200).json({
        message: "This recruiter account already exists. Please login instead."
      });
    }

    console.log("STEP 9 - Inserting recruiter into users");

    const [insertResult] = await db.query(
      `INSERT INTO users (name, email, phone, password, role, status)
       VALUES (?, ?, ?, ?, 'recruiter', 'Active')`,
      [name, email, phone, password]
    );

    console.log("STEP 10 - Insert result:", insertResult);

    const [updateResult] = await db.query(
      "UPDATE recruiter_invites SET status = 'Accepted' WHERE email = ?",
      [email]
    );

    console.log("STEP 11 - Update result:", updateResult);

    const [updatedInvite] = await db.query(
      "SELECT id, email, token, status FROM recruiter_invites WHERE email = ?",
      [email]
    );

    console.log("STEP 12 - Updated invite row:", updatedInvite);

    return res.status(201).json({
      message: "Recruiter signup completed successfully"
    });

  } catch (error) {
    console.error("Complete recruiter signup error:", error);
    return res.status(500).json({
      message: "Server error while creating recruiter account"
    });
  }
};