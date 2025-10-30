const Group = require("../../../models/groupsModel");
const User = require("../../../models/userModel");

const createGroupService = async (
  groupName,
  members,
  adminId,
  groupImage = ""
) => {
  const newGroupName = groupName.toLowerCase();

  const existingGroup = await Group.findOne({
    groupName: { $regex: newGroupName, $options: "i" },
  });
  if (existingGroup) {
    throw new Error(
      `"${
        newGroupName.charAt(0).toUpperCase() + newGroupName.slice(1)
      }" Group is already exists`
    );
  }

  if (members && Array.isArray(members)) {
    for (const memberId of members) {
      const userExists = await User.findById(memberId);
      if (!userExists) {
        throw new Error(`User with id ${memberId} does not exist`);
      }
    }
  }

  const memberList = members && Array.isArray(members) ? [...members] : [];
  if (!memberList.includes(adminId.toString())) {
    memberList.push(adminId);
  }

  const groupData = {
    groupName: newGroupName,
    groupImage,
    adminId,
    members: memberList,
  };

  const group = await Group.create(groupData);
  return await Group.findById(group._id)
    .populate("members", "username")
    .populate("adminId", "username");
};

const getGroupDetailsService = async (groupId, userId) => {
  const group = await Group.findById(groupId)
    .populate("members", "username")
    .populate("adminId", "username");

  if (!group) {
    throw new Error("Group not found");
  }
  const isMember = group.members.some(
    (member) => member._id.toString() === userId.toString()
  );
  if (!isMember) {
    throw new Error("You are not a member of this group");
  }

  return group;
};

const addToGroupService = async (groupId, userIds, adminId) => {
  const userIdArray = Array.isArray(userIds) ? userIds : [userIds];

  if (userIdArray.length === 0) {
    throw new Error("Please provide at least one user ID to add");
  }

  const group = await Group.findById(groupId)
    .populate("members", "-password")
    .populate("adminId", "-password");

  if (!group) {
    throw new Error("Group not found");
  }

  if (group.adminId._id.toString() !== adminId.toString()) {
    throw new Error("Only group admin can add users");
  }

  const addedUsers = [];
  const alreadyInGroup = [];
  const notFoundUsers = [];

  for (const userId of userIdArray) {
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      notFoundUsers.push(userId);
      continue;
    }

    const isUserInGroup = group.members.some(
      (member) => member._id.toString() === userId.toString()
    );

    if (isUserInGroup) {
      alreadyInGroup.push(userId);
      continue;
    }

    group.members.push(userId);
    addedUsers.push(userId);
  }

  if (addedUsers.length > 0) {
    await group.save();
  }

  const updatedGroup = await Group.findById(groupId)
    .populate("members", "-password")
    .populate("adminId", "-password");

  return {
    group: updatedGroup,
    results: {
      added: addedUsers,
      alreadyInGroup,
      notFound: notFoundUsers,
    },
  };
};

const removeFromGroupService = async (groupId, userIds, adminId) => {
  const userIdArray = Array.isArray(userIds) ? userIds : [userIds];

  if (userIdArray.length === 0) {
    throw new Error("Please provide at least one user ID to remove");
  }

  const group = await Group.findById(groupId)
    .populate("members", "-password")
    .populate("adminId", "-password");

  if (!group) {
    throw new Error("Group not found");
  }

  if (group.adminId._id.toString() !== adminId.toString()) {
    throw new Error("Only the admin can remove users from the group");
  }

  const removedUsers = [];
  const notInGroup = [];
  const notFoundUsers = [];
  const adminCannotRemoveSelf = [];
  const userIdsToRemoveSuccessfully = [];

  for (const userId of userIdArray) {
    const userToRemove = await User.findById(userId);
    if (!userToRemove) {
      notFoundUsers.push(userId);
      continue;
    }

    const isUserInGroup = group.members.some(
      (member) => member._id.toString() === userId.toString()
    );

    if (!isUserInGroup) {
      notInGroup.push(userId);
      continue;
    }

    if (userId === group.adminId._id.toString()) {
      adminCannotRemoveSelf.push(userId);
      continue;
    }

    userIdsToRemoveSuccessfully.push(userId);
  }

  let updatedGroup = group;

  if (userIdsToRemoveSuccessfully.length > 0) {
    updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { $pull: { members: { $in: userIdsToRemoveSuccessfully } } },
      { new: true }
    ).populate("members", "-password");

    removedUsers.push(...userIdsToRemoveSuccessfully);
  }

  return {
    group: updatedGroup,
    results: {
      removed: removedUsers,
      notInGroup,
      notFound: notFoundUsers,
      adminCannotRemoveSelf,
    },
  };
};

const updateGroupSettingsService = async (groupId, adminId, updateData) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new Error("Group not found");
  }

  if (group.adminId.toString() !== adminId.toString()) {
    throw new Error("Only group admin can update group settings");
  }

  if (updateData.groupName) {
    const newGroupName = updateData.groupName.toLowerCase();

    if (newGroupName !== group.groupName.toLowerCase()) {
      const existingGroup = await Group.findOne({
        groupName: { $regex: newGroupName, $options: "i" },
      });

      if (existingGroup) {
        throw new Error(
          `"${
            newGroupName.charAt(0).toUpperCase() + newGroupName.slice(1)
          }" Group is already exists`
        );
      }
    } else {
      return;
    }
  } else {
    return;
  }

  const updatedGroup = await Group.findByIdAndUpdate(groupId, updateData, {
    new: true,
  })
    .populate("members", "username profilePicture")
    .populate("adminId", "username profilePicture");

  return updatedGroup;
};

const getUserGroupsService = async (userId) => {
  return await Group.find({
    members: { $elemMatch: { $eq: userId } },
  })
    .select("groupName groupImage members adminId")
    .populate("members", "username profilePicture")
    .populate("adminId", "username  profilePicture")
    .sort({ updatedAt: -1 });
};

module.exports = {
  createGroupService,
  getGroupDetailsService,
  addToGroupService,
  removeFromGroupService,
  updateGroupSettingsService,
  getUserGroupsService,
};
