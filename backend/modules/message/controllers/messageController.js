const asyncHandler = require("express-async-handler");
const {
  sendMessageService,
  getMessagesService,
} = require("../services/messageService");

const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, message, type = "text" } = req.body;

  if (!message || !receiverId) {
    res.status(400);
    throw new Error("Invalid data: message and receiverId are required");
  }

  try {
    const populatedMessage = await sendMessageService(
      req.user._id,
      receiverId,
      message,
      type
    );
    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const getMessages = asyncHandler(async (req, res) => {
  try {
    const { receiverId } = req.params;
    const { messages, unreadMessages } = await getMessagesService(
      req.user._id,
      receiverId
    );

    const io = req.app.get("io");

    res.status(200).json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = {
  sendMessage,
  getMessages,
};
