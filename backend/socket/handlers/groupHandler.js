const Group = require("../../models/groupsModel");
const { activeUsers } = require("./baseHandler");
const GroupMessage = require("../../models/groupMessageModel");

const handleNewGroupMessage = async (socket, messageData, io) => {
  if (!socket.userId) {
    console.warn("new group message received before setup; ignoring.");
    return;
  }

  const { _id: messageId, groupId } = messageData;

  if (!messageId || !groupId) {
    return;
  }

  try {
    let message = await GroupMessage.findById(messageId)
      .populate("senderId", "username profilePicture")
      .populate("groupId", "groupName groupImage");

    if (!message) {
      return;
    }

    const group = await Group.findById(groupId).populate("members", "_id");

    if (!group) {
      return;
    }

  
    if (
      !group.members.some(
        (member) => member._id.toString() === socket.userId.toString()
      )
    ) {
      console.log(`User ${socket.userId} is not a member of group ${groupId}`);
      return;
    }

 
    socket.to(groupId).emit("new group message", message);

    
    const notification = {
      _id: message._id,
      isGroupChat: true,
      senderId: message.senderId,
      content: message.message,
      chatId: group._id,
      groupInfo: {
        _id: group._id,
        groupName: group.groupName,
        groupImage: group.groupImage,
      },
      createdAt: message.createdAt,
      status: "sent",
    };


    group.members.forEach((member) => {
      if (member._id.toString() !== socket.userId.toString()) {
        io.to(member._id.toString()).emit("new notification", notification);
      }
    });

    const onlineMembers = group.members.filter(
      (member) =>
        member._id.toString() !== socket.userId.toString() &&
        activeUsers.has(member._id.toString())
    );

    if (onlineMembers.length > 0) {
      const updatedMessage = await GroupMessage.findByIdAndUpdate(
        messageId,
        {
          $addToSet: {
            deliveredTo: { $each: onlineMembers.map((m) => m._id) },
          },
          status: "delivered",
        },
        { new: true }
      )
        .populate("senderId", "username profilePicture")
        .populate("groupId", "groupName groupImage");

      if (updatedMessage) {
    
        io.to(groupId).emit("group message status updated", {
          messageId: message._id,
          message: updatedMessage,
          groupId: groupId,
          statusType: "initial_delivery",
          deliveredTo: onlineMembers.map((m) => m._id),
        });
      }
    }
  } catch (error) {
    console.error("Error handling new group message:", error);
    socket.emit("error", { message: "Failed to process group message" });
  }
};

const handleGroupMessageStatus = async (socket, data, io) => {
  try {
    const { messageId, groupId, status } = data;

    if (!socket.userId) {
      // console.log("Unauthorized group message status update attempt");
      return;
    }

    if (!messageId || !groupId || !status) {
      console.log("Missing required fields in group message status update");
      return;
    }

    if (!["delivered", "read"].includes(status)) {
      console.log("Invalid status type for group message");
      return;
    }

  
    const updateData = { status };

    if (status === "delivered") {
      updateData.$addToSet = { deliveredTo: socket.userId };
    } else if (status === "read") {
      updateData.$addToSet = { readBy: socket.userId };

      updateData.$addToSet = { deliveredTo: socket.userId };
    }

    const updatedMessage = await GroupMessage.findOneAndUpdate(
      { _id: messageId, groupId },
      { $set: updateData },
      {
        new: true,
        populate: [
          { path: "senderId", select: "username profilePicture" },
          { path: "groupId", select: "groupName groupImage" },
        ],
      }
    );

    if (!updatedMessage) {
      console.error(
        "Group message not found or doesn't belong to group:",
        messageId
      );
      return;
    }


    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(socket.userId)) {
      console.log("User is not a member of the group");
      return;
    }


    io.to(groupId).emit("group message status updated", {
      messageId,
      status,
      userId: socket.userId,
      groupId,
      message: updatedMessage,
      statusType: status,
    
      deliveredTo: updatedMessage.deliveredTo || [],
      readBy: updatedMessage.readBy || [],
    });

    if (
      status === "read" &&
      updatedMessage.senderId._id.toString() !== socket.userId.toString()
    ) {
      io.to(updatedMessage.senderId._id.toString()).emit("message read", {
        messageId,
        groupId,
        readBy: updatedMessage.readBy || [],
      });
    }
  } catch (error) {
    console.error("Error handling group message status:", error);
    socket.emit("error", { message: "Failed to update message status" });
  }
};

const handleGroupUserAdded = (socket, data, io) => {
  const { groupId, userId } = data;
  socket.to(groupId).emit("user joined group", { groupId, userId });
};

const handleGroupUserRemoved = (socket, data, io) => {
  const { groupId, userId } = data;
  socket.to(groupId).emit("user left group", { groupId, userId });
};

const handleGroupSettingsUpdated = (socket, groupData, io) => {
  const { _id } = groupData;
  socket.to(_id).emit("group updated", groupData);
};

const handleJoinGroup = (socket, groupId) => {
  if (!groupId) return;
  socket.join(groupId);
  // console.log(`User ${socket.userId} joined group: ${groupId}`);
};

const handleLeaveGroup = (socket, groupId) => {
  if (!groupId) return;
  socket.leave(groupId);
  // console.log(`User ${socket.userId} left group: ${groupId}`);
};

module.exports = {
  handleNewGroupMessage,
  handleGroupUserAdded,
  handleGroupUserRemoved,
  handleGroupSettingsUpdated,
  handleJoinGroup,
  handleLeaveGroup,
  handleGroupMessageStatus,
};
