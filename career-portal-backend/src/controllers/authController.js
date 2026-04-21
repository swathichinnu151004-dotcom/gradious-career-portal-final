const db = require("../config/connectDB");
const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const sendEmail = require("../utils/sendMail");
const { passwordResetUrl, assertFrontendUrlOkForEmailLinks } = require("../utils/frontendPublicUrl");

function normalizeGoogleWebClientId(value) {
  let s = String(value || "").trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

/* ================= FORGOT PASSWORD ================= */

/** Use the promise pool API only — callback `db.query(..., cb)` can mis-handle connections with `mysql2/promise`. */
async function runQuery(sql, values) {
  const [rows] = await db.query(sql, values);
  return rows;
}

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const users = await runQuery("SELECT * FROM users WHERE email = ?", [email]);

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const urlCheck = assertFrontendUrlOkForEmailLinks();
    if (!urlCheck.ok) {
      return res.status(urlCheck.status).json({ message: urlCheck.message });
    }

    const token = crypto.randomBytes(32).toString("hex");

    await runQuery(
      `UPDATE users
       SET reset_token = ?, reset_token_expiry = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
       WHERE email = ?`,
      [token, email]
    );

    const resetLink = passwordResetUrl(token).url;

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Reset Password</h2>
        <p>You requested to reset your password.</p>
        <p>Click below to set a new password:</p>
        <a href="${resetLink}" 
           style="display:inline-block;padding:12px 20px;background:#dc2626;color:#fff;text-decoration:none;border-radius:6px;">
           Reset Password
        </a>
        <p style="margin-top:15px;">This link will expire in 15 minutes.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "Reset Password - Gradious Careers Portal",
      html,
    });

    return res.status(200).json({
      message: "Reset password email sent successfully",
    });
  } catch (error) {
    logger.error("Forgot Password Error:", error);
    return res.status(500).json({
      message: error.message || "Error sending reset password email",
    });
  }
};
/* ================= RESET PASSWORD ================= */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Token, new password, and confirm password are required"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirm password do not match"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    const [users] = await db.query(
      `SELECT id, email, reset_token_expires
       FROM users
       WHERE reset_token = ?
       LIMIT 1`,
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const user = users[0];

    if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ message: "Reset token has expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      `UPDATE users
       SET password = ?, reset_token = NULL, reset_token_expires = NULL
       WHERE id = ?`,
      [hashedPassword, user.id]
    );

    return res.status(200).json({
      message: "Password has been reset successfully"
    });
  } catch (error) {
    logger.error("Reset Password Error:", error);
    return res.status(500).json({ message: "Failed to reset password" });
  }
};
// LOGIN
// const bcrypt = require("bcrypt"); // only needed if passwords are hashed
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Identifier and password are required",
      });
    }

    let account = null;
    let accountType = "user";

    // 1. Check users table first
    const [userResults] = await db.query(
      `SELECT * FROM users WHERE email = ? OR phone = ? LIMIT 1`,
      [identifier, identifier]
    );

    if (userResults.length > 0) {
      account = userResults[0];
      accountType = "user";
    } else {
      // 2. If not found, check recruiters table
      const [recruiterResults] = await db.query(
        `SELECT * FROM recruiters WHERE email = ? OR phone = ? LIMIT 1`,
        [identifier, identifier]
      );

      if (recruiterResults.length > 0) {
        account = recruiterResults[0];
        accountType = "recruiter";
      }
    }

    if (!account) {
      return res.status(404).json({ message: "User does not exist" });
    }

    if (account.status && account.status.toLowerCase() !== "active") {
      return res.status(403).json({ message: "Your account is blocked" });
    }

    const isMatch = await bcrypt.compare(password, account.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const role = String(account.role || accountType).toLowerCase().trim();

    const token = jwt.sign(
      { id: account.id, role },
      process.env.JWT_SECRET || "mysecretkey",
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      role,
      user: {
        id: account.id,
        name: account.name,
        email: account.email,
        phone: account.phone,
      },
    });
  } catch (error) {
    logger.error("Login error:", error);
    return res.status(500).json({ message: "Server error during login" });
  }
};

function displayNameFromGooglePayload(payload, email) {
  const full = String(payload.name || "").trim();
  if (full) return full;
  const g = String(payload.given_name || "").trim();
  const f = String(payload.family_name || "").trim();
  const combo = `${g} ${f}`.trim();
  if (combo) return combo;
  const local = String(email || "").split("@")[0];
  return local || "User";
}

/** Unique 10-digit placeholder phone for Google-only signups (Indian-style pattern). */
async function allocateUniquePlaceholderPhone() {
  for (let attempt = 0; attempt < 35; attempt += 1) {
    const phone = `9${String(Math.floor(100000000 + Math.random() * 900000000))}`;
    const [rows] = await db.query(
      "SELECT id FROM users WHERE phone = ? LIMIT 1",
      [phone]
    );
    if (rows.length === 0) return phone;
  }
  throw new Error("Could not allocate unique phone placeholder");
}

/**
 * Google ID token → JWT for candidates (`users`, role user).
 * Existing user: sign in. New verified Gmail: create account then sign in.
 */
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential || typeof credential !== "string") {
      return res.status(400).json({ message: "Google credential is required" });
    }

    const clientId = normalizeGoogleWebClientId(process.env.GOOGLE_CLIENT_ID);
    if (!clientId) {
      return res.status(503).json({
        message: "Google sign-in is not enabled on this server",
      });
    }

    const oAuthClient = new OAuth2Client(clientId);
    const ticket = await oAuthClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    const email = (payload.email || "").trim().toLowerCase();

    if (!email || payload.email_verified !== true) {
      return res.status(401).json({
        message: "Google account email is missing or not verified",
      });
    }

    const [userResults] = await db.query(
      `SELECT * FROM users
       WHERE LOWER(TRIM(email)) = ?
       AND LOWER(TRIM(COALESCE(role, 'user'))) = 'user'
       LIMIT 1`,
      [email]
    );

    let account = userResults[0] || null;
    let created = false;

    if (account) {
      if (account.status && String(account.status).toLowerCase() !== "active") {
        return res.status(403).json({ message: "Your account is blocked" });
      }
    } else {
      const [otherUsers] = await db.query(
        `SELECT id, role FROM users WHERE LOWER(TRIM(email)) = ? LIMIT 1`,
        [email]
      );
      if (otherUsers.length > 0) {
        const r = String(otherUsers[0].role || "user").toLowerCase();
        if (r === "admin") {
          return res.status(403).json({
            message:
              "This email is registered as an admin. Sign in with email and password.",
          });
        }
        return res.status(409).json({
          message:
            "This email is already registered. Use email sign-in or the correct portal for your role.",
        });
      }

      const [recRows] = await db.query(
        `SELECT id FROM recruiters WHERE LOWER(TRIM(email)) = ? LIMIT 1`,
        [email]
      );
      if (recRows.length > 0) {
        return res.status(409).json({
          message:
            "This email is registered as a recruiter. Use recruiter sign-in instead.",
        });
      }

      const nameTrim = displayNameFromGooglePayload(payload, email);
      const cityTrim = "Not specified";
      const qualTrim = "Other";
      const phoneTrim = await allocateUniquePlaceholderPhone();
      const randomPw = crypto.randomBytes(32).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPw, 10);

      try {
        const [ins] = await db.query(
          `INSERT INTO users (name, email, phone, city, qualification, password, role, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            nameTrim,
            email,
            phoneTrim,
            cityTrim,
            qualTrim,
            hashedPassword,
            "user",
            "Active",
          ]
        );
        const newId = ins.insertId;
        const [fresh] = await db.query(
          `SELECT * FROM users WHERE id = ? LIMIT 1`,
          [newId]
        );
        account = fresh[0];
        created = true;
      } catch (insertErr) {
        logger.error("Google signup insert error:", insertErr);
        if (insertErr.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            message:
              "Could not complete Google sign-up (email or phone already in use). Try signing in instead.",
          });
        }
        throw insertErr;
      }
    }

    const role = "user";
    const token = jwt.sign(
      { id: account.id, role },
      process.env.JWT_SECRET || "mysecretkey",
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: created
        ? "Welcome! Your candidate account was created with Google."
        : "Login successful",
      token,
      role,
      created,
      user: {
        id: account.id,
        name: account.name,
        email: account.email,
        phone: account.phone,
      },
    });
  } catch (error) {
    logger.error("Google login error:", error);
    return res.status(401).json({
      message: "Google sign-in could not be verified. Please try again.",
    });
  }
};

const getGoogleClientId = (req, res) => {
  res.json({ clientId: normalizeGoogleWebClientId(process.env.GOOGLE_CLIENT_ID) });
};

// REGISTER USER

const registerUser = async (req, res) => {
  try {
    const { name, email, phone, city, qualification, password } = req.body;

    const nameTrim = String(name || "").trim();
    const emailTrim = String(email || "").trim();
    const phoneTrim = String(phone || "").trim();
    const cityTrim = String(city || "").trim();
    const qualTrim = String(qualification || "").trim();

    if (!nameTrim || !emailTrim || !phoneTrim || !cityTrim || !qualTrim || !password) {
      return res.status(400).json({
        message: "Name, email, phone, city, qualification, and password are required.",
      });
    }

    if (cityTrim.length < 2) {
      return res.status(400).json({ message: "City must be at least 2 characters." });
    }

    const [existingUsers] = await db.query(
      "SELECT id, email, phone FROM users WHERE email = ? OR phone = ?",
      [emailTrim, phoneTrim]
    );

    if (existingUsers.length > 0) {
      const emailExists = existingUsers.some((u) => u.email === emailTrim);
      const phoneExists = existingUsers.some((u) => u.phone === phoneTrim);

      if (emailExists) {
        return res.status(400).json({ message: "Email already registered" });
      }

      if (phoneExists) {
        return res.status(400).json({ message: "Phone number already registered" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO users (name, email, phone, city, qualification, password, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nameTrim, emailTrim, phoneTrim, cityTrim, qualTrim, hashedPassword, "user", "Active"]
    );

    return res.status(201).json({ message: "Registration successful" });
  } catch (error) {
  logger.error("Register error:", error);

  if (error.code === "ER_DUP_ENTRY") {
    if (error.sqlMessage.includes("unique_users_email")) {
      return res.status(400).json({ message: "Email already registered" });
    }

    if (error.sqlMessage.includes("unique_users_phone")) {
      return res.status(400).json({ message: "Phone number already registered" });
    }

    return res.status(400).json({ message: "Duplicate entry not allowed" });
  }

  return res.status(500).json({ message: "Server error during registration" });
}
};
// GET /api/auth/validate-invite/:token
const validateInviteToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Token is missing" });
    }

    const [rows] = await db.query(
      `SELECT id, email, status, expires_at
       FROM recruiter_invites
       WHERE token = ?
       LIMIT 1`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Invalid invite link" });
    }

    const invite = rows[0];

    if (invite.status === "Accepted") {
      return res.status(400).json({ message: "Invite already used" });
    }

    if (new Date() > new Date(invite.expires_at)) {
      return res.status(400).json({ message: "Invite expired" });
    }

    return res.status(200).json({
      message: "Invite token is valid",
      email: invite.email
    });
  } catch (error) {
    logger.error("Validate invite token error:", error);
    return res.status(500).json({ message: "Server error while validating invite" });
  }
};
// POST /api/auth/register-recruiter

const registerRecruiter = async (req, res) => {
  try {
    const { token, name, password, company_name, phone, location } = req.body;

    if (!token || !name || !password || !company_name || !phone || !location) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [inviteResults] = await db.query(
      `SELECT * FROM recruiter_invites WHERE token = ? AND status = 'Pending'`,
      [token]
    );

    if (inviteResults.length === 0) {
      return res.status(400).json({ message: "Invalid or expired invite token" });
    }

    const email = inviteResults[0].email;

    const [recruiterResults] = await db.query(
      `SELECT * FROM recruiters WHERE email = ?`,
      [email]
    );

    if (recruiterResults.length > 0) {
      return res.status(400).json({ message: "Recruiter already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO recruiters
        (name, email, password, company_name, phone, location, role, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'recruiter', 'Active', NOW())`,
      [name, email, hashedPassword, company_name, phone, location]
    );

    await db.query(`UPDATE recruiter_invites SET status = 'Accepted' WHERE token = ?`, [
      token,
    ]);

    return res.status(201).json({ message: "Recruiter registered successfully" });
  } catch (error) {
    logger.error("Register recruiter error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  login,
  googleLogin,
  getGoogleClientId,
  registerUser,
  registerRecruiter,
  validateInviteToken,
  forgotPassword,
  resetPassword,
};