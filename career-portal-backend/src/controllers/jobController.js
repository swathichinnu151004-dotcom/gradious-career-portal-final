const db = require("../config/connectDB");

// CREATE JOB
exports.createJob = async (req, res) => {
  try {
    console.log("Inside createJob");

    // ✅ ADD HERE
    console.log("USER:", req.user);

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

    console.log("Before insert");

    const [result] = await db.query(query, [
      job_title,
      department,
      location,
      experience,
      description,
      recruiterId,
      status || "ACTIVE"
    ]);

    console.log("After insert");

    res.status(201).json({
      message: "Job created successfully",
      jobId: result.insertId
    });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
// GET ALL JOBS
exports.getAllJobs = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, job_title, department, location, experience, description, recruiter_id, posted_date, status
      FROM jobs
      ORDER BY posted_date DESC
    `);

    res.json(rows);
  } catch (error) {
    console.log("Get all jobs error:", error);
    res.status(500).json({ message: "Error fetching jobs" });
  }
};

// GET LATEST JOBS
exports.getLatestJobs = (req, res) => {
  const sql = `
    SELECT id, job_title, department, location, experience, description, recruiter_id, posted_date, status
    FROM jobs
    ORDER BY posted_date DESC
    LIMIT 3
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.log("Latest jobs error:", err);
      return res.status(500).json({ message: "Error fetching latest jobs" });
    }

    res.json(results);
  });
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
    console.log("Get job by id error:", error);
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
      "SELECT id, job_title FROM jobs WHERE id = ?",
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

    await db.query(
      `INSERT INTO applications (user_id, job_id, resume, status, applied_date)
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, jobId, resumePath, "Applied"]
    );

    return res.status(201).json({
      message: "Application submitted successfully"
    });
  } catch (error) {
    console.error("Apply job error:", error);
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
    console.log("Get my applications error:", error);
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
    console.log("Search jobs error:", error);
    res.status(500).json({ message: "Error searching jobs" });
  }
};
exports.getLatestJobs = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM jobs 
      WHERE posted_date >= CURDATE() - INTERVAL 60 DAY
      ORDER BY posted_date DESC
    `);

    res.json(rows);

  } catch (error) {
    console.log("Error fetching jobs:", error);
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

    await db.query(
      "UPDATE applications SET status = ? WHERE id = ?",
      [status, applicationId]
    );

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
    console.error("Department Stats Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};