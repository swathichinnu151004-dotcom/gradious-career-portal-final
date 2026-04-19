const nodemailer = require("nodemailer");
const logger = require("./logger");

let cachedTransporter = null;

function getTransporter() {
  const user = (process.env.EMAIL_USER || "").trim();
  const pass = (process.env.EMAIL_PASS || "").trim();

  if (!user || !pass) {
    throw new Error(
      "Email is not configured: set EMAIL_USER and EMAIL_PASS in career-portal-backend/.env (use a Gmail App Password for EMAIL_PASS)."
    );
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });
  }

  return cachedTransporter;
}

const sendMail = async ({ to, subject, text, html, from }) => {
  if (!to) {
    throw new Error("Recipient email is missing");
  }

  const authUser = (process.env.EMAIL_USER || "").trim();
  const displayName =
    process.env.MAIL_FROM_DISPLAY || "Gradious Careers (Do not reply)";
  const defaultFrom = authUser
    ? `"${displayName}" <${authUser}>`
    : `"${displayName}" <noreply@localhost>`;

  const mailOptions = {
    from: from || defaultFrom,
    to,
    subject,
    text,
    html,
  };

  const transporter = getTransporter();
  const info = await transporter.sendMail(mailOptions);
  logger.info("Email dispatched", {
    subject,
    messageId: info.messageId,
    response: info.response,
  });
  return info;
};

/** Logs whether Gmail SMTP auth works (call once at server startup). */
sendMail.verifySmtpConfig = async function verifySmtpConfig() {
  try {
    await getTransporter().verify();
    logger.info("SMTP verify OK (smtp.gmail.com:465)");
  } catch (e) {
    logger.error(
      "SMTP verify failed — outbound email disabled until credentials are fixed:",
      e.message
    );
  }
};

module.exports = sendMail;