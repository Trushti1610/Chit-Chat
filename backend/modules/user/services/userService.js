const User = require("../../../models/userModel");
const getAllUsersService = async () => {
  return await User.find().select("-password");
};

const getUserProfileService = async (userId) => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new Error("User not found");
  }

  return {
    _id: user._id,
    username: user.username,
    mobile: user.mobile,
    status: user.status,
    profilePicture: user.profilePicture,
    lastSeen: user.lastSeen,
  };
};

const updateUserProfileService = async (userId, updateData, profilePicture) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }
  if (updateData.username) user.username = updateData.username.toLowerCase();
  if (updateData.mobile) user.mobile = updateData.mobile;
  if (updateData.status) user.status = updateData.status;
  if (profilePicture) user.profilePicture = profilePicture;

  const updatedUser = await user.save();

  return {
    _id: updatedUser._id,
    username: updatedUser.username,
    mobile: updatedUser.mobile,
    status: updatedUser.status,
    profilePicture: updatedUser.profilePicture,
    lastSeen: updatedUser.lastSeen,
  };
};

const searchUsersService = async (searchQuery) => {
  if (!searchQuery) {
    throw new Error("Search query is required");
  }

  const searchRegex = new RegExp(searchQuery, "i");
  return await User.find({
    $or: [{ username: searchRegex }, { mobile: searchRegex }],
  }).select("-password");
};

const getUserStatusService = async (userId) => {
  const user = await User.findById(userId).select("lastSeen");

  if (!user) {
    throw new Error("User not found");
  }

 const isOnline = Date.now() - new Date(user.lastSeen).getTime() < 30000;

  return {
    isOnline,
    lastSeen: user.lastSeen,
  };
};

module.exports = {
  getAllUsersService,
  getUserProfileService,
  updateUserProfileService,
  searchUsersService,
  getUserStatusService,
};
