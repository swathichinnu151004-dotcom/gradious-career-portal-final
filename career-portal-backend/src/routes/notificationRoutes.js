const express = require("express");
const router = express.Router();

const {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

const verifyToken = require("../middleware/authMiddleware");

router.get("/unread-count", verifyToken, getUnreadNotificationCount);
router.put("/mark-all-read", verifyToken, markAllNotificationsAsRead);
router.put("/read-all/all", verifyToken, markAllNotificationsAsRead);
router.delete("/:id", verifyToken, deleteNotification);
router.put("/:id/read", verifyToken, markNotificationAsRead);
router.get("/", verifyToken, getNotifications);

module.exports = router;
