const Group = require("../../../models/groupsModel");
const GroupMessage = require("../../../models/groupMessageModel");

const sendGroupMessageService = async (
  groupId,
  senderId,
  message,
  type = "text"
) => {
  const [group, existingMessage] = await Promise.all([
    Group.findById(groupId),
    GroupMessage.findOne({ groupId, senderId, message, type })
      .sort({ createdAt: -1 })
      .limit(1),
  ]);

  if (!group) {
    throw new Error("Group not found");
  }

  if (existingMessage && Date.now() - existingMessage.createdAt < 5000) {
    return existingMessage;
  }

  const newMessage = await GroupMessage.create({
    groupId,
    senderId,
    message,
    type,
    status: "sent",
  });

  return GroupMessage.findById(newMessage._id)
    .populate("senderId", "username profilePicture")
    .populate("groupId", "groupName groupImage")
    .lean(); 
};

const getGroupMessagesService = async (groupId, userId) => {
  const [group, messages] = await Promise.all([
    Group.findById(groupId),
    GroupMessage.find({ groupId })
      .populate("senderId", "username profilePicture")
      .populate("groupId", "groupName groupImage")
      .sort({ createdAt: 1 })
      .lean(), 
  ]);

  if (!group) {
    throw new Error("Group not found");
  }

  const isMember = group.members.some(
    (member) => member.toString() === userId.toString()
  );

  if (!isMember) {
    throw new Error("You are not a member of this group");
  }

  return messages;
};

module.exports = {
  sendGroupMessageService,
  getGroupMessagesService,
};
