const db = require("../config/connectDB");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../utils/sendMail");

/* ================= FORGOT PASSWORD ================= */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const userEmail = email.trim().toLowerCase();

    const [users] = await db.query(
      "SELECT id, name, email FROM users WHERE LOWER(email) = ? LIMIT 1",
      [userEmail]
    );

    // Security: do not reveal whether email exists or not
    if (users.length === 0) {
      return res.status(200).json({
        message: "If this email is registered, a reset link has been sent."
      });
    }

    const user = users[0];

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.query(
      "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
      [resetToken, expiry, user.id]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #1d4ed8;">Reset Your Password</h2>
        <p>Hello ${user.name || "User"},</p>
        <p>We received a request to reset your password for your Gradious Careers Portal account.</p>
        <p>
          <a href="${resetLink}" 
             style="display:inline-block; padding:10px 18px; background:#2563eb; color:#fff; text-decoration:none; border-radius:6px;">
             Reset Password
          </a>
        </p>
        <p>This link will expire in <b>15 minutes</b>.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
        <br />
        <p>Regards,<br/>Gradious Careers Portal Team</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: "Reset Your Password - Gradious Careers Portal",
      html
    });

    return res.status(200).json({
      message: "If this email is registered, a reset link has been sent."
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ message: "Failed to process forgot password request" });
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
    console.error("Reset Password Error:", error);
    return res.status(500).json({ message: "Failed to reset password" });
  }
};
// LOGIN
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Identifier and password are required"
      });
    }

    const [results] = await db.query(
      `SELECT * FROM users 
       WHERE email = ? OR phone = ?
       LIMIT 1`,
      [identifier, identifier]   // ✅ FIX HERE
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "User does not exist" });
    }

    const user = results[0];

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "mysecretkey",
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      role: user.role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error during login" });
  }
};
// REGISTER USER
const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const [checkResult] = await db.query(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (checkResult.length > 0) {
      return res.status(409).json({ message: "You already registered. Please login." });
    }

    const fullName = `${firstName} ${lastName}`;

    await db.query(
      "INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, 'user')",
      [fullName, email, phone, password]
    );

    return res.status(201).json({ message: "Registration successful" });
  } catch (error) {
    console.error("Register user error:", error);
    return res.status(500).json({ message: "Error registering user" });
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
    console.error("Validate invite token error:", error);
    return res.status(500).json({ message: "Server error while validating invite" });
  }
};
// POST /api/auth/register-recruiter
const registerRecruiter = async (req, res) => {
  try {
    const { token, name, phone, company_name, location, password } = req.body;

    if (!token || !name || !phone || !company_name || !location || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [inviteRows] = await db.query(
      `SELECT * FROM recruiter_invites 
       WHERE token = ? AND status = 'Pending' AND expires_at > NOW()`,
      [token]
    );

    if (inviteRows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired invite token" });
    }

    const invitedEmail = inviteRows[0].email;

    const [existingRecruiter] = await db.query(
      "SELECT id FROM recruiters WHERE email = ?",
      [invitedEmail]
    );

    if (existingRecruiter.length > 0) {
      return res.status(400).json({ message: "Recruiter already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO recruiters
       (name, email, phone, company_name, location, password, role, status)
       VALUES (?, ?, ?, ?, ?, ?, 'recruiter', 'Active')`,
      [name.trim(), invitedEmail, phone.trim(), company_name.trim(), location.trim(), hashedPassword]
    );

    await db.query(
      "UPDATE recruiter_invites SET status = 'Accepted' WHERE token = ?",
      [token]
    );

    return res.status(201).json({
      message: "Recruiter registered successfully"
    });
  } catch (error) {
    console.error("registerRecruiter error:", error);
    return res.status(500).json({ message: "Server error while registering recruiter" });
  }
};
module.exports = {
  login,
  registerUser,
  registerRecruiter,
  validateInviteToken,
  forgotPassword,
  resetPassword
};