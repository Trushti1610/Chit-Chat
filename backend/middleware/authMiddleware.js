const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded.id) {
        res.status(401);
        throw new Error("Invalid token format");
      }

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        res.status(401);
        throw new Error(`User not found with ID: ${decoded.id}`);
      }

      req.user = user;
      req.user.token = token;

      next();
    } catch (error) {
      console.error("Auth error:", error);
      if (error.name === "JsonWebTokenError") {
        res.status(401);
        throw new Error("Invalid token");
      } else if (error.name === "TokenExpiredError") {
        res.status(401);
        throw new Error("Token expired");
      } else {
        res.status(401);
        throw new Error(error.message || "Not authorized, token failed");
      }
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

module.exports = { protect };
