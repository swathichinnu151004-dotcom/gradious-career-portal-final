const db = require("../config/connectDB");
const logger = require("./logger");

/** Match DB ENUM / app convention: application | job | profile | system */
const NOTIFICATION_TYPES = new Set([
  "application",
  "job",
  "profile",
  "system",
]);

function normalizeNotificationType(raw) {
  const t = String(raw || "system")
    .toLowerCase()
    .trim();
  if (NOTIFICATION_TYPES.has(t)) return t;
  return "system";
}

/**
 * Insert one notification row for a recipient.
 * Supports both { recipientId, recipientRole } and legacy { userId, role }.
 */
exports.createNotification = async ({
  recipientId,
  recipientRole,
  userId,
  role,
  senderId = null,
  title,
  message,
  type = "system",
  relatedId = null,
  referenceType = null,
}) => {
  let uid = recipientId ?? userId;
  const r = String(recipientRole ?? role ?? "")
    .toLowerCase()
    .trim();

  if (uid !== null && uid !== undefined && uid !== "") {
    const n = Number(uid);
    uid = Number.isFinite(n) ? n : uid;
  }

  if (uid == null || uid === "" || !r || !title || !message) {
    logger.warn("createNotification: missing recipient or text", {
      uid,
      r,
      hasTitle: Boolean(title),
    });
    return;
  }

  let sid = senderId;
  if (sid !== null && sid !== undefined && sid !== "") {
    const sn = Number(sid);
    sid = Number.isFinite(sn) ? sn : sid;
  } else {
    sid = null;
  }

  const typeNorm = normalizeNotificationType(type);

  try {
    await db.query(
      `INSERT INTO notifications (user_id, role, sender_id, title, message, type, related_id, reference_type, is_read)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [uid, r, sid, title, message, typeNorm, relatedId, referenceType]
    );
  } catch (error) {
    if (error && error.code === "ER_BAD_FIELD_ERROR") {
      try {
        await db.query(
          `INSERT INTO notifications (user_id, role, title, message, type, related_id, is_read)
           VALUES (?, ?, ?, ?, ?, ?, 0)`,
          [uid, r, title, message, typeNorm, relatedId]
        );
        return;
      } catch (inner) {
        logger.error(
          "[notifications] insert fallback failed:",
          inner.code,
          inner.sqlMessage || inner.message
        );
        return;
      }
    }
    logger.error(
      "[notifications] insert failed:",
      error.code,
      error.sqlMessage || error.message
    );
  }
};
