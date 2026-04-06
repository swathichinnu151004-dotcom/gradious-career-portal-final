const db = require("../config/connectDB");

const createNotification = async ({
  userId,
  title,
  message,
  type = "info",
  relatedId = null,
  relatedType = null
}) => {
  try {
    await db.query(
      `INSERT INTO notifications 
       (user_id, title, message, type, related_id, related_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, title, message, type, relatedId, relatedType]
    );
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

module.exports = createNotification;