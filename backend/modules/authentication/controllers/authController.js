const asyncHandler = require("express-async-handler");
const {
  registerUserService,
  authUserService,
} = require("../services/authService");

const registerUser = asyncHandler(async (req, res) => {
  try {
    const userData = await registerUserService(req.body);
    res.status(201).json(userData);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const authUser = asyncHandler(async (req, res) => {
  try {
    const userData = await authUserService(req.body);
    res.json(userData);
  } catch (error) {
    res.status(401);
    throw new Error(error.message);
  }
});


module.exports = {
  registerUser,
  authUser,
};
