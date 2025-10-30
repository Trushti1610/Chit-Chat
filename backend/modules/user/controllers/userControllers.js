const asyncHandler = require("express-async-handler");
const {
  getAllUsersService,
  getUserProfileService,
  updateUserProfileService,
  searchUsersService,
  getUserStatusService,
} = require("../services/userService");

const getAllUser = asyncHandler(async (req, res) => {
  try {
    const users = await getAllUsersService();
    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: error.message });
  }
});

const getUserProfile = asyncHandler(async (req, res) => {
  try {
    const userData = await getUserProfileService(req.params.id);
    res.json(userData);
  } catch (error) {
    res.status(400);
    throw new Error("Invalid user ID or user not found");
  }
});

const updateUserProfile = asyncHandler(async (req, res) => {
  try {

    if (req.user._id.toString() !== req.params.id) {
      res.status(401);
      throw new Error("Not authorized");
    }

    const updateData = {
      username: req.body.username,
      mobile: req.body.mobile,
      status: req.body.status,
    };

    let profilePicture = null;
    if (req.file) {
      profilePicture = `${req.protocol}://${req.get(
        "host"
      )}/uploads/profile-pictures/${req.file.filename}`;
    }

    const updatedUser = await updateUserProfileService(
      req.params.id,
      updateData,
      profilePicture
    );

    const token =
      req.user.token ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);
    
    res.json({
      ...updatedUser,
      token,
    });
  } catch (error) {
    res.status(500);
    throw new Error(error.message || "Server error");
  }
});

const searchUsers = asyncHandler(async (req, res) => {
  try {
    const { search } = req.query;
    const users = await searchUsersService(search);
    res.status(200).json(users);
  } catch (error) {
    res.status(500);
    throw new Error(error.message || "Failed to search users");
  }
});

const getUserStatus = asyncHandler(async (req, res) => {
  try {
    const statusData = await getUserStatusService(req.params.id);
    res.json(statusData);
  } catch (error) {
    res.status(400);
    throw new Error("Invalid user ID or user not found");
  }
});

module.exports = {
  getUserProfile,
  updateUserProfile,
  getAllUser,
  searchUsers,
  getUserStatus,
};
