const express = require("express");
const router = express.Router();
const { protect } = require("../../../middleware/authMiddleware");
const {
  getNotifications,
  togglePushNotifications,
  markNotificationsAsRead,
} = require("../controllers/notificationController");


router.get("/", protect, getNotifications);
router.post("/push", protect, togglePushNotifications);
router.put("/read", protect, markNotificationsAsRead);

module.exports = router;
