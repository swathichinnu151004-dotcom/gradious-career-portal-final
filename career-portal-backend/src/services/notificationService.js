const db = require("../config/connectDB");
const { createNotification } = require("../utils/createNotification");

/**
 * JWT for recruiters uses `recruiters.id`. Some jobs store `recruiter_id` as that id,
 * but others may store a `users.id` for the same person — map so notifications hit the inbox they actually open.
 */
async function resolveRecruiterRecipientId(jobRecruiterId) {
  if (jobRecruiterId === null || jobRecruiterId === undefined || jobRecruiterId === "") {
    return null;
  }
  const n = Number(jobRecruiterId);
  const id = Number.isFinite(n) ? n : jobRecruiterId;

  const [direct] = await db.query(
    "SELECT id FROM recruiters WHERE id = ? LIMIT 1",
    [id]
  );
  if (direct.length > 0) {
    return direct[0].id;
  }

  const [viaUser] = await db.query(
    `SELECT r.id
     FROM recruiters r
     INNER JOIN users u
       ON u.email = r.email
       OR (u.phone IS NOT NULL AND r.phone IS NOT NULL AND u.phone = r.phone)
     WHERE u.id = ?
     LIMIT 1`,
    [id]
  );
  if (viaUser.length > 0) {
    return viaUser[0].id;
  }

  return id;
}

async function getAdminRecipientIds() {
  const [rows] = await db.query(
    "SELECT id FROM users WHERE LOWER(TRIM(role)) = 'admin'"
  );
  return rows.map((r) => r.id);
}

/**
 * When a candidate applies: notify owning recruiter and all admins.
 */
async function onUserAppliedToJob({
  applicationId,
  applicantUserId,
  applicantName,
  jobTitle,
  recruiterId,
}) {
  const hasRecruiter =
    recruiterId !== null && recruiterId !== undefined && recruiterId !== "";

  if (hasRecruiter) {
    const recipientRecruiterId = await resolveRecruiterRecipientId(recruiterId);
    await createNotification({
      recipientId: recipientRecruiterId,
      recipientRole: "recruiter",
      senderId: applicantUserId,
      title: "New application received",
      message: `${applicantName} applied for ${jobTitle}`,
      type: "application",
      relatedId: applicationId,
      referenceType: "application",
    });
  }

  const adminIds = await getAdminRecipientIds();
  await Promise.all(
    adminIds.map((adminId) =>
      createNotification({
        recipientId: adminId,
        recipientRole: "admin",
        senderId: applicantUserId,
        title: "New application submitted",
        message: `New application submitted for ${jobTitle}`,
        type: "application",
        relatedId: applicationId,
        referenceType: "application",
      })
    )
  );
}

/**
 * When a recruiter posts a job: notify all admins.
 */
async function onRecruiterPostedJob({ recruiterId, jobId, jobTitle }) {
  const adminIds = await getAdminRecipientIds();
  await Promise.all(
    adminIds.map((adminId) =>
      createNotification({
        recipientId: adminId,
        recipientRole: "admin",
        senderId: recruiterId,
        title: "New job posted",
        message: `Recruiter posted a new job: ${jobTitle}`,
        type: "job",
        relatedId: jobId,
        referenceType: "job",
      })
    )
  );
}

/**
 * When application status becomes Shortlisted or Rejected: notify the applicant (user role).
 */
async function onApplicationStatusForUser({
  userId,
  jobTitle,
  status,
  applicationId,
  senderId = null,
}) {
  const normalized = String(status || "").toLowerCase();
  if (!["shortlisted", "rejected"].includes(normalized)) {
    return;
  }

  const isShortlisted = normalized === "shortlisted";
  await createNotification({
    recipientId: userId,
    recipientRole: "user",
    senderId,
    title: isShortlisted ? "Application shortlisted" : "Application rejected",
    message: isShortlisted
      ? `Your application for ${jobTitle} has been shortlisted`
      : `Your application for ${jobTitle} has been rejected`,
    type: "application",
    relatedId: applicationId,
    referenceType: "application",
  });
}

module.exports = {
  getAdminRecipientIds,
  resolveRecruiterRecipientId,
  onUserAppliedToJob,
  onRecruiterPostedJob,
  onApplicationStatusForUser,
};
