const db = require("../config/connectDB");
const logger = require("../utils/logger");

/** Match JWT role to DB `notifications.role` regardless of casing (e.g. Recruiter vs recruiter). */
function roleParam(req) {
  return String(req.user?.role || "").toLowerCase().trim();
}

/** JWT may use `id`, `userId`, or `sub` depending on client / legacy tokens. */
function userIdParam(req) {
  const raw = req.user?.id ?? req.user?.userId ?? req.user?.sub;
  if (raw === undefined || raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : raw;
}

function parseIsRead(val) {
  if (val === null || val === undefined) return false;
  if (typeof val === "boolean") return val;
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(val)) {
    return val.length > 0 && val[0] === 1;
  }
  if (typeof val === "string") {
    const s = val.trim().toLowerCase();
    if (["1", "true", "yes", "read"].includes(s)) return true;
    if (["0", "false", "no", "unread", ""].includes(s)) return false;
  }
  const n = Number(val);
  if (Number.isFinite(n)) return n !== 0;
  return Boolean(val);
}

function unreadOnlyParam(req) {
  const v = req.query.unreadOnly;
  if (v === true || v === 1) return true;
  const s = String(v ?? "").toLowerCase().trim();
  return s === "1" || s === "true" || s === "yes";
}

/** Works for tinyint, BOOL, CHAR, ENUM-like values in MySQL. */
function sqlRowIsUnread() {
  return `NOT (
    is_read <=> 1
    OR LOWER(TRIM(CAST(is_read AS CHAR(32)))) IN ('1','true','yes','read')
  )`;
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    isRead: parseIsRead(row.is_read),
    relatedId: row.related_id,
    referenceType: row.reference_type,
    senderId: row.sender_id,
    createdAt: row.created_at,
  };
}

exports.getNotifications = async (req, res) => {
  try {
    const userId = userIdParam(req);
    const role = roleParam(req);
    if (userId == null || !role) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 30, 1),
      100
    );

    const unreadOnly = unreadOnlyParam(req);
    const unreadSql = unreadOnly ? ` AND ${sqlRowIsUnread()} ` : " ";

    let rows;
    const whereRecipient = `WHERE user_id = ? AND LOWER(TRIM(role)) = ?${unreadSql}`;
    const orderLimit = `ORDER BY created_at DESC LIMIT ?`;
    const paramsFull = [userId, role, limit];
    try {
      const [r] = await db.query(
        `SELECT id, title, message, type, is_read, related_id, reference_type, sender_id, created_at
         FROM notifications ${whereRecipient} ${orderLimit}`,
        paramsFull
      );
      rows = r;
    } catch (err) {
      if (
        err &&
        err.code === "ER_BAD_FIELD_ERROR" &&
        /sender_id|reference_type/i.test(String(err.message || ""))
      ) {
        const [r] = await db.query(
          `SELECT id, title, message, type, is_read, related_id, created_at
           FROM notifications ${whereRecipient} ${orderLimit}`,
          paramsFull
        );
        rows = r;
      } else {
        throw err;
      }
    }

    return res.json({
      success: true,
      notifications: rows.map(mapRow),
    });
  } catch (error) {
    logger.error("Get notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching notifications",
    });
  }
};

exports.getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = userIdParam(req);
    const role = roleParam(req);
    if (userId == null || !role) {
      return res.status(401).json({
        success: false,
        unreadCount: 0,
        message: "Invalid token payload",
      });
    }

    const [rows] = await db.query(
      `SELECT COUNT(*) AS unreadCount
       FROM notifications
       WHERE user_id = ? AND LOWER(TRIM(role)) = ?
         AND ${sqlRowIsUnread()}`,
      [userId, role]
    );

    const rawCount = rows[0]?.unreadCount;
    const unreadCount =
      typeof rawCount === "bigint" ? Number(rawCount) : Number(rawCount) || 0;

    return res.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    logger.error("Unread count error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching unread count",
    });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const userId = userIdParam(req);
    const role = roleParam(req);
    if (userId == null || !role) {
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }
    const notificationId = Number(req.params.id);
    if (!Number.isFinite(notificationId)) {
      return res.status(400).json({ success: false, message: "Invalid notification id" });
    }

    const [result] = await db.query(
      `UPDATE notifications
       SET is_read = 1
       WHERE id = ? AND user_id = ? AND LOWER(TRIM(role)) = ?`,
      [notificationId, userId, role]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    logger.error("Mark notification read error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating notification",
    });
  }
};

exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = userIdParam(req);
    const role = roleParam(req);
    if (userId == null || !role) {
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }

    await db.query(
      `UPDATE notifications
       SET is_read = 1
       WHERE user_id = ? AND LOWER(TRIM(role)) = ?
         AND ${sqlRowIsUnread()}`,
      [userId, role]
    );

    return res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    logger.error("Mark all notifications read error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating notifications",
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const userId = userIdParam(req);
    const role = roleParam(req);
    if (userId == null || !role) {
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }
    const notificationId = Number(req.params.id);
    if (!Number.isFinite(notificationId)) {
      return res.status(400).json({ success: false, message: "Invalid notification id" });
    }

    const [result] = await db.query(
      `DELETE FROM notifications WHERE id = ? AND user_id = ? AND LOWER(TRIM(role)) = ?`,
      [notificationId, userId, role]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    logger.error("Delete notification error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting notification",
    });
  }
};
