const Message = require("../../models/messageModel");
const { activeUsers } = require("./baseHandler");

const handleNewMessage = async (socket, messageData, io) => {
  const receiverId = messageData.receiverId?._id || messageData.receiverId;

  if (!receiverId) {
    return;
  }

  if (activeUsers.has(receiverId.toString())) {
    messageData.status = "delivered";
    await Message.findByIdAndUpdate(messageData._id, {
      status: "delivered",
    });

    io.to(socket.id).emit("message status updated", {
      messageId: messageData._id,
      status: "delivered",
      message: messageData,
    });
  }

  io.to(receiverId).emit("message received", messageData);
  io.to(receiverId).emit("new notification", {
    _id: messageData._id,
    isGroupChat: false,
    sender: {
      _id: socket.userId,
      username: messageData.senderId?.username || "User",
      profilePicture: messageData.senderId?.profilePicture || "",
    },
    content: messageData.message,
    chatId: messageData.senderId._id,
    createdAt: new Date(),
  });
};

const handleMessageDelivery = async (socket, data, io) => {
  try {
    if (!socket.userId) {
      return;
    }

    const { messageId, senderId } = data;

    const message = await Message.findById(messageId);
    if (!message) {
      return;
    }

    if (message.receiverId.toString() !== socket.userId.toString()) {
      return;
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { status: "delivered" },
      { new: true }
    )
      .populate("senderId", "username profilePicture")
      .populate("receiverId", "username profilePicture");

    const senderSocket = activeUsers.get(senderId.toString());
    if (senderSocket) {
      io.to(senderSocket).emit("message status updated", {
        messageId,
        status: "delivered",
        message: updatedMessage,
      });
    }

    const receiverId =
      updatedMessage.receiverId._id || updatedMessage.receiverId;
    const receiverSocket = activeUsers.get(receiverId.toString());
    if (receiverSocket) {
      io.to(receiverSocket).emit("message delivered", {
        messageId,
        status: "delivered",
        message: updatedMessage,
      });
    }
  } catch (error) {
    console.error("Error handling message delivery:", error);
  }
};

const handleMessageRead = async (socket, data, io) => {
  try {
    if (!socket.userId) {
      return;
    }

    const { messageId, senderId } = data;

    const message = await Message.findById(messageId)
      .populate("senderId", "username profilePicture")
      .populate("receiverId", "username profilePicture");

    if (!message) {
      // console.error("Message not found for read update:", messageId);
      return;
    }

    if (message.receiverId._id.toString() !== socket.userId.toString()) {
      console.error("User is not authorized to mark this message as read");
      return;
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { status: "read" },
      { new: true }
    )
      .populate("senderId", "username profilePicture")
      .populate("receiverId", "username profilePicture");

    const senderSocket = activeUsers.get(senderId.toString());
    if (senderSocket) {
      io.to(senderSocket).emit("message status updated", {
        messageId,
        status: "read",
        message: updatedMessage,
      });
    }

    const receiverId =
      updatedMessage.receiverId._id || updatedMessage.receiverId;
    const receiverSocket = activeUsers.get(receiverId.toString());
    if (receiverSocket) {
      io.to(receiverSocket).emit("message status updated", {
        messageId,
        status: "read",
        message: updatedMessage,
      });
    }
  } catch (error) {
    console.error("Error handling message read:", error);
  }
};

const handleClearNotifications = async (socket, data, io) => {
  try {
    const { chatId, isGroupChat } = data;
    if (isGroupChat) {
      // console.log(
      //   `Clearing notifications for group ${chatId} for user ${socket.userId}`
      // );
    } else {
      const messages = await Message.find({
        senderId: chatId,
        receiverId: socket.userId,
        status: { $ne: "read" },
      });

      if (messages.length > 0) {
        await Message.updateMany(
          {
            senderId: chatId,
            receiverId: socket.userId,
            status: { $ne: "read" },
          },
          { status: "read" }
        );

        const senderSocket = activeUsers.get(chatId.toString());
        if (senderSocket) {
          messages.forEach((msg) => {
            io.to(senderSocket).emit("message status updated", {
              messageId: msg._id,
              status: "read",
              message: msg,
            });
          });
        }
      }
    }
  } catch (error) {
    console.error("Error clearing notifications:", error);
  }
};

module.exports = {
  handleNewMessage,
  handleMessageDelivery,
  handleMessageRead,
  handleClearNotifications,
};
