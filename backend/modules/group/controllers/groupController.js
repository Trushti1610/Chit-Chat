const asyncHandler = require("express-async-handler");
const {
  createGroupService,
  getGroupDetailsService,
  addToGroupService,
  removeFromGroupService,
  updateGroupSettingsService,
  getUserGroupsService,
} = require("../services/groupService");



const createGroup = asyncHandler(async (req, res) => {
  let { groupName, members } = req.body;
  const adminId = req.user._id;


  if (!groupName) {
    res.status(400);
    throw new Error("Please provide a group name");
  }

  let groupImage = null;
  if (req.file) {
    groupImage = `${req.protocol}://${req.get(
      "host"
    )}/uploads/group/GroupImage/${req.file.filename}`;
  }

  try {
    const populatedGroup = await createGroupService(
      groupName,
      members,
      adminId,
      groupImage
    );


    const io = req.app.get("io");
    if (io) {
   
      if (req.user && req.user._id) {
        io.to(req.user._id.toString()).emit(
          "new group created",
          populatedGroup
        );
      }

      populatedGroup.members.forEach((member) => {
        if (req.user && member._id.toString() !== req.user._id.toString()) {
          io.to(member._id.toString()).emit(
            "new group created",
            populatedGroup
          );
        }
      });
    }

    res.status(201).json(populatedGroup);
  } catch (error) {
    res.status(error.statusCode || 500);
    throw new Error(error.message || "Failed to create group");
  }
});

const getGroupDetails = asyncHandler(async (req, res) => {
  try {
    const group = await getGroupDetailsService(req.params.id, req.user._id);
    res.status(200).json(group);
  } catch (error) {
    res.status(error.statusCode || 500);
    throw new Error(error.message || "Error fetching group details");
  }
});


const addToGroup = asyncHandler(async (req, res) => {
  try {
    const result = await addToGroupService(
      req.params.id,
      req.body.userIds,
      req.user._id
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500);
    throw new Error(error.message || "Failed to add users to group");
  }
});


const removeFromGroup = asyncHandler(async (req, res) => {
  try {
    const result = await removeFromGroupService(
      req.params.id,
      req.body.userIds,
      req.user._id
    );

    const io = req.app.get("io");
    if (io && result.group) {
      result.group.members.forEach((member) => {
        io.to(member._id.toString()).emit("group updated", result.group);
      });

      result.results.removed.forEach((userId) => {
        io.to(userId.toString()).emit("removed from group", {
          groupId: req.params.id,
        });
      });
    }

    res.status(200).json({
      success: true,
      message: `${result.results.removed.length} user(s) removed successfully.`,
      ...result,
    });
  } catch (error) {
    res.status(error.statusCode || 500);
    throw new Error(error.message || "Error removing users from group");
  }
});


const updateGroupSettings = asyncHandler(async (req, res) => {
  try {
    const updateData = {};

    if (req.body.groupName) {
      updateData.groupName = req.body.groupName;
    }

    if (req.file) {
      updateData.groupImage = `${req.protocol}://${req.get(
        "host"
      )}/uploads/group/GroupImage/${req.file.filename}`;
    }

    const updatedGroup = await updateGroupSettingsService(
      req.params.id,
      req.user._id,
      updateData
    );

 
    const io = req.app.get("io");
    if (io && updatedGroup) {
      updatedGroup.members.forEach((member) => {
        io.to(member._id.toString()).emit("group updated", updatedGroup);
      });
    }

    res.status(200).json({
      success: true,
      message: "Group settings updated successfully",
      data: updatedGroup,
    });
  } catch (error) {
    res.status(error.statusCode || 500);
    throw new Error(error.message || "Failed to update group settings");
  }
});

const getUserGroups = asyncHandler(async (req, res) => {
  try {
    const groups = await getUserGroupsService(req.user._id);
    res.status(200).json(groups);
  } catch (error) {
    res.status(error.statusCode || 500);
    throw new Error(error.message || "Error fetching user groups");
  }
});

module.exports = {
  createGroup,
  getGroupDetails,
  addToGroup,
  removeFromGroup,
  updateGroupSettings,
  getUserGroups,
};
