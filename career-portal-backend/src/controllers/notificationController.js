const db = require("../config/connectDB");

exports.getNotificationCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0",
      [userId]
    );

    res.json({ count: rows[0].count || 0 });
  } catch (error) {
    console.log("Notification count error:", error);
    res.status(500).json({ message: "Error fetching notification count" });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT id, title, message, type, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.log("Get notifications error:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    await db.query(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
      [notificationId, userId]
    );

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.log("Mark read error:", error);
    res.status(500).json({ message: "Error updating notification" });
  }
};