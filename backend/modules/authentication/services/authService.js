const User = require("../../../models/userModel");
const generateToken = require("../../../config/generateToken");

const registerUserService = async (userData) => {
  const { username, mobile, password} = userData;

  
  if (!username || !mobile || !password) {
    throw new Error("Please Enter all the fields");
  }

  const userExists = await User.findOne({ mobile });
  if (userExists) {
    throw new Error("User already exists");
  }

  const user = await User.create({
    username,
    mobile,
    password
  });

  if (!user) {
    throw new Error("Failed to create the user");
  }

  return {
    _id: user._id,
    username: user.username,
    mobile: user.mobile,
    profilePicture: user.profilePicture,
    status: user.status,
    lastSeen: user.lastSeen,
    token: generateToken(user._id),
  };
};

const authUserService = async (credentials) => {
  const { mobile, username, password } = credentials;
  let user;
  if (mobile) {
    user = await User.findOne({ mobile });
  } else if (username) {
    user = await User.findOne({ username });
  }


  if (user && (await user.matchPassword(password))) {
    user.lastSeen = Date.now();
    await user.save();

    return {
      _id: user._id,
      username: user.username,
      mobile: user.mobile,
      profilePicture: user.profilePicture,
      status: user.status,
      lastSeen: user.lastSeen,
      token: generateToken(user._id),
    };
  }

  throw new Error("Invalid credentials");
};


module.exports = {
  registerUserService,
  authUserService,
};
