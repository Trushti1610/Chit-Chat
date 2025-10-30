const express = require("express");
const upload = require("../../../config/multerConfig");
const {
  updateUserProfile,
  getUserProfile,
  getAllUser,
  searchUsers,
  getUserStatus,
} = require("../controllers/userControllers");
const { protect } = require("../../../middleware/authMiddleware");
const router = express.Router();

router.get("/", protect, getAllUser);
router.get("/search", protect, searchUsers);
router.get("/:id", protect, getUserProfile);
router.put("/:id", protect, upload.single("profileImage"), updateUserProfile);
router.get("/status/:id", protect, getUserStatus);
module.exports = router;
