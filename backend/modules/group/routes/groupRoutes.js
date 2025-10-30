const express = require("express");
const router = express.Router();
const { protect } = require("../../../middleware/authMiddleware");
const upload = require("../../../config/multerConfig");
const {
  createGroup,
  getGroupDetails,
  addToGroup,
  removeFromGroup,
  updateGroupSettings,
  getUserGroups,
} = require("../controllers/groupController");


router.post("/", protect, upload.single("groupImage"), createGroup);
router.get("/", protect, getUserGroups);
router.get("/:id", protect, getGroupDetails);
router.put("/:id/add", protect, addToGroup);
router.put("/:id/remove", protect, removeFromGroup);
router.put(
  "/:id/settings",
  protect,
  upload.single("groupImage"),
  updateGroupSettings
);

module.exports = router;
