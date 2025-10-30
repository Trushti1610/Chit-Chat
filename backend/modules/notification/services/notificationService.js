const User = require("../../../models/userModel");
const Message = require("../../../models/messageModel");
const GroupMessage = require("../../../models/groupMessageModel");
const Group = require("../../../models/groupsModel");

const getNotificationsService = async (userId) => {
  const unreadOneToOneMessages = await Message.find({
    receiverId: userId,
    status: { $in: ["sent", "delivered"] },
  })
    .populate("senderId", "username profilePicture")
    .sort({ createdAt: -1 })
    .limit(50);
  
  const userGroups = await Group.find({
    members: { $elemMatch: { $eq: userId } },
  }).select("_id");

  const userGroupIds = userGroups.map((group) => group._id);

  const unreadGroupMessages = await GroupMessage.find({
    groupId: { $in: userGroupIds },
    senderId: { $ne: userId },
    status: { $ne: "read" }, 
  })
    .populate("senderId", "username profilePicture")
    .populate("groupId", "groupName groupImage")
    .sort({ createdAt: -1 })
    .limit(50);

  const notifications = [
    ...unreadOneToOneMessages.map((msg) => ({
      _id: msg._id,
      isGroupChat: false,
      senderId: msg.senderId,
      content: msg.message,
      chatId: msg.senderId._id, 
      createdAt: msg.createdAt,
    })),
    ...unreadGroupMessages.map((msg) => ({
      _id: msg._id,
      isGroupChat: true,
      senderId: msg.senderId,
      content: msg.message,
      chatId: msg.groupId._id,
      groupInfo: {
        _id: msg.groupId._id,
        groupName: msg.groupId.groupName,
        groupImage: msg.groupId.groupImage,
      },
      createdAt: msg.createdAt,
    })),
  ];

  return notifications.sort((a, b) => b.createdAt - a.createdAt);
};

const togglePushNotificationsService = async (userId, enabled) => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { pushNotificationsEnabled: enabled },
    { new: true }
  );

  if (!updatedUser) {
    throw new Error("User not found");
  }

  return {
    success: true,
    message: `Push notifications ${enabled ? "enabled" : "disabled"}`,
  };
};

const markNotificationsAsReadService = async (userId, messageIds) => {
  if (!messageIds || !Array.isArray(messageIds)) {
    throw new Error("Message IDs array is required");
  }
  await Message.updateMany(
    {
      _id: { $in: messageIds },
      receiverId: userId,
    },
    { status: "read" }
  );

  await GroupMessage.updateMany(
    {
      _id: { $in: messageIds },
    },
    { status: "read" }
  );

  return { success: true };
};

module.exports = {
  getNotificationsService,
  togglePushNotificationsService,
  markNotificationsAsReadService,
};
