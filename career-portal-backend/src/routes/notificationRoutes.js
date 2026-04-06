const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const notificationController = require("../controllers/notificationController");

router.get(
  "/count",
  verifyToken,
  roleMiddleware("user"),
  notificationController.getNotificationCount
);

router.get(
  "/",
  verifyToken,
  roleMiddleware("user"),
  notificationController.getNotifications
);

router.put(
  "/:id/read",
  verifyToken,
  roleMiddleware("user"),
  notificationController.markNotificationAsRead
);

module.exports = router;