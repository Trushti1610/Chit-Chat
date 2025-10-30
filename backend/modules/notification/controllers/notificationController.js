const asyncHandler = require("express-async-handler");
const {
  getNotificationsService,
  togglePushNotificationsService,
  markNotificationsAsReadService,
} = require("../services/notificationService");

const getNotifications = asyncHandler(async (req, res) => {
  try {
    const notifications = await getNotificationsService(req.user._id);
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

const togglePushNotifications = asyncHandler(async (req, res) => {
  try {
    const { enabled } = req.body;
    const result = await togglePushNotificationsService(req.user._id, enabled);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating push notification settings:", error);
    res.status(500).json({ message: "Server error" });
  }
});
const markNotificationsAsRead = asyncHandler(async (req, res) => {
  try {
    const { messageIds } = req.body;
    const result = await markNotificationsAsReadService(
      req.user._id,
      messageIds
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = {
  getNotifications,
  togglePushNotifications,
  markNotificationsAsRead,
};
