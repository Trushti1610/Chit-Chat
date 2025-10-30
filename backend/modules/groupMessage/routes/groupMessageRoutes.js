const express = require("express");
const router = express.Router();
const { protect } = require("../../../middleware/authMiddleware");

const {
  sendGroupMessage,
  getGroupMessage
} = require("../controllers/groupMessageController");

router.post("/:id/messages", protect, sendGroupMessage);
router.get("/:id/fetchmessages", protect, getGroupMessage);

module.exports = router;
