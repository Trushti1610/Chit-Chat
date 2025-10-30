const asyncHandler = require("express-async-handler");
const {
  sendGroupMessageService,
  getGroupMessagesService
} = require("../services/groupMessageService");

const sendGroupMessage = asyncHandler(async (req, res) => {
  const groupId = req.params.id;
  const { message, type } = req.body;
  const senderId = req.user._id;

  if (!message || !groupId) {
    res.status(400);
    throw new Error("Message and groupId are required");
  }

  try {
    const populatedMessage = await sendGroupMessageService(
      groupId,
      senderId,
      message,
      type
    );

    if (req.app.get("io")) {
      req.app
        .get("io")
        .to(groupId.toString())
        .emit("group message received", populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(error.statusCode || 500);
    throw new Error(error.message || "Error sending group message");
  }
});

const getGroupMessage = asyncHandler(async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id;

    const messages = await getGroupMessagesService(groupId, userId);
    res.status(200).json(messages);
  } catch (error) {
    res.status(error.statusCode || 500);
    throw new Error(error.message || "Error fetching group messages");
  }
});

module.exports = {
  sendGroupMessage,
  getGroupMessage,
};
