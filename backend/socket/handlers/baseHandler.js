const Message = require("../../models/messageModel");
const User = require("../../models/userModel");


const activeUsers = new Map();

const activeGroups = new Set();

const handleUserSetup = async (socket, userData, io) => {
  if (!userData || !userData._id) {
    console.log("Invalid user data in setup");
    return;
  }

  // console.log(`User ${userData._id} connected with socket ${socket.id}`);


  socket.userId = userData._id;
  activeUsers.set(userData._id.toString(), socket.id);
  socket.join(userData._id);
 

  try {
    const pendingMessages = await Message.find({
      receiverId: userData._id,
      status: "sent",
    })
      .populate("senderId", "username profilePicture")
      .populate("receiverId", "username profilePicture");

    if (pendingMessages.length > 0) {
      await Message.updateMany(
        { _id: { $in: pendingMessages.map((m) => m._id) } },
        { status: "delivered" }
      );

      pendingMessages.forEach((message) => {
        const senderId = message.senderId._id.toString();
        if (activeUsers.has(senderId)) {
          const senderSocketId = activeUsers.get(senderId);
          io.to(senderSocketId).emit("message status updated", {
            messageId: message._id,
            status: "delivered",
            message: { ...message.toObject(), status: "delivered" },
          });
        }
      });
    }
  } catch (error) {
    console.error("Error marking messages as delivered:", error);
  }

  socket.emit("connected");
  await handleUserStatusUpdate(socket, userData, io);
};

const handleUserStatusUpdate = async (socket, userData, io) => {
  try {
    const user = await User.findById(userData._id);
    if (user) {
      user.lastSeen = new Date();
      await user.save();
    }
    io.emit("user status update", {
      userId: userData._id,
      isOnline: true,
      lastSeen: null,
    });
  } catch (error) {
    console.error("Error updating user status:", error.message);
  }
};

const handleDisconnect = async (socket, io) => {
  // console.log(`USER DISCONNECTED: ${socket.userId}`);

  if (socket.userId) {
    try {
      const user = await User.findById(socket.userId);
      if (user) {
        user.lastSeen = new Date();
        await user.save();
        io.emit("user status update", {
          userId: socket.userId,
          isOnline: false,
          lastSeen: user.lastSeen,
        });
      }
    } catch (error) {
      console.error("Error updating last seen on disconnect:", error.message);
    }

    activeUsers.delete(socket.userId.toString());
  }
};

module.exports = {
  activeUsers,
  activeGroups,
  handleUserSetup,
  handleUserStatusUpdate,
  handleDisconnect,
};
