const sendMail = require("./sendMail");
const logger = require("./logger");

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHtml(html) {
  if (!html) return "";
  return String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * One-time automated confirmation when a candidate applies (do not reply).
 * @param {object} opts
 * @param {string} opts.to — applicant email
 * @param {string} opts.applicantName
 * @param {object} opts.job — row from `jobs` (job_title, department, location, experience, status, etc.)
 * @param {number|string} opts.applicationId
 */
async function sendJobApplicationConfirmationEmail({
  to,
  applicantName,
  job,
  applicationId,
}) {
  const email = String(to || "").trim();
  if (!email) {
    logger.warn(
      "[sendJobApplicationConfirmationEmail] Skipping: no applicant email"
    );
    return;
  }

  const support =
    process.env.SUPPORT_EMAIL ||
    process.env.SUPPORT_CONTACT_EMAIL ||
    "gradiousrecruitment@gmail.com";

  const title = job?.job_title || "the role";
  const department = job?.department || "—";
  const location = job?.location || "—";
  const experience = job?.experience || "—";
  const jobStatus = job?.status || "—";
  const appliedAt = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const descPreview = stripHtml(job?.description);
  const descShort =
    descPreview.length > 280
      ? `${descPreview.slice(0, 280).trim()}…`
      : descPreview;

  const subject = `Application received – ${title}`;

  const text = `Dear ${applicantName || "Applicant"},

We have received your application for the following position.

Position: ${title}
Department: ${department}
Location: ${location}
Experience: ${experience}
Job status: ${jobStatus}
Application reference: #${applicationId}
Submitted: ${appliedAt}

This is a one-time automated confirmation. Please do not reply to this email; this inbox is not monitored.

For questions about your application, contact: ${support}

Thank you for your interest in Gradious Careers Portal.

— Gradious Careers (automated message)${descShort ? `\n\nRole summary:\n${descShort}` : ""}`;

  const safeName = escapeHtml(applicantName || "Applicant");
  const safeTitle = escapeHtml(title);
  const safeDept = escapeHtml(department);
  const safeLoc = escapeHtml(location);
  const safeExp = escapeHtml(experience);
  const safeStatus = escapeHtml(jobStatus);
  const safeSupport = escapeHtml(support);
  const safeDescShort = descShort ? escapeHtml(descShort) : "";

  const html = `
        <div style="font-family: Arial, Helvetica, sans-serif; background:#f4f6f9; padding:24px;">
          <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 14px rgba(0,0,0,0.08);">
            <div style="background:#0f3d91; color:#ffffff; padding:16px 24px; font-size:18px; font-weight:bold;">
              Gradious Careers Portal
            </div>
            <div style="padding:24px; color:#1f2937; line-height:1.65; font-size:15px;">
              <p style="margin:0 0 16px;">Dear <strong>${safeName}</strong>,</p>
              <p style="margin:0 0 16px;">
                We have <strong>received your application</strong> for the position below. This email confirms that your submission was recorded successfully.
              </p>
              <table style="width:100%; border-collapse:collapse; margin:16px 0; font-size:14px;">
                <tr><td style="padding:8px 0; color:#64748b; width:38%;">Position</td><td style="padding:8px 0;"><strong>${safeTitle}</strong></td></tr>
                <tr><td style="padding:8px 0; color:#64748b;">Department</td><td style="padding:8px 0;">${safeDept}</td></tr>
                <tr><td style="padding:8px 0; color:#64748b;">Location</td><td style="padding:8px 0;">${safeLoc}</td></tr>
                <tr><td style="padding:8px 0; color:#64748b;">Experience</td><td style="padding:8px 0;">${safeExp}</td></tr>
                <tr><td style="padding:8px 0; color:#64748b;">Job listing status</td><td style="padding:8px 0;">${safeStatus}</td></tr>
                <tr><td style="padding:8px 0; color:#64748b;">Application reference</td><td style="padding:8px 0;">#${escapeHtml(String(applicationId))}</td></tr>
                <tr><td style="padding:8px 0; color:#64748b;">Submitted</td><td style="padding:8px 0;">${escapeHtml(appliedAt)}</td></tr>
              </table>
              ${
                safeDescShort
                  ? `<p style="margin:12px 0 0; font-size:13px; color:#334155;"><strong>Role summary</strong><br/>${safeDescShort}</p>`
                  : ""
              }
              <p style="margin:20px 0 0; font-size:13px; color:#475569;">
                <strong>Note:</strong> This is a <strong>one-time automated message</strong>. Please <strong>do not reply</strong> to this email — the address is not monitored.
              </p>
              <p style="margin:12px 0 0; font-size:13px; color:#475569;">
                For support or questions about your application, please contact:<br/>
                <a href="mailto:${safeSupport}" style="color:#2563eb;">${safeSupport}</a>
              </p>
            </div>
            <div style="background:#f8fafc; padding:14px 24px; font-size:12px; color:#6b7280; border-top:1px solid #e5e7eb;">
              Automated notification · Do not reply<br/>
              Gradious Careers Portal
            </div>
          </div>
        </div>
      `;

  await sendMail({ to: email, subject, text, html });
}

module.exports = { sendJobApplicationConfirmationEmail };
