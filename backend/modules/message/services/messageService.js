const Message = require("../../../models/messageModel");
const User = require("../../../models/userModel");

const sendMessageService = async (
  senderId,
  receiverId,
  message,
  type = "text"
) => {
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    throw new Error("Receiver not found");
  }

  const newMessage = await Message.create({
    senderId,
    receiverId,
    message,
    type,
    status: "sent", 
  });

  return await Message.findById(newMessage._id)
    .populate("senderId", "username profilePicture")
    .populate("receiverId", "username profilePicture");
};

const getMessagesService = async (userId, receiverId) => {
  const messages = await Message.find({
    $or: [
      { senderId: userId, receiverId: receiverId },
      { senderId: receiverId, receiverId: userId },
    ],
  })
    .populate("senderId", "username profilePicture")
    .populate("receiverId", "username profilePicture")
    .sort({ createdAt: 1 });

  return {
    messages,
    unreadMessages: messages.filter(
      (msg) =>
        msg.receiverId._id.toString() === userId.toString() &&
        msg.status !== "read"
    ),
  };
};

module.exports = {
  sendMessageService,
  getMessagesService,
 
};
