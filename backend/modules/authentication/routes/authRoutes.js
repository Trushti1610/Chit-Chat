const express = require("express");
const {
  registerUser,
  authUser,
} = require("../controllers/authController");

const { protect } = require("../../../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", authUser);


module.exports = router;
