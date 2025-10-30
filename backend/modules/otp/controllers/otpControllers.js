const asyncHandler = require("express-async-handler");
const { sendOTPService, verifyOTPService } = require("../services/otpService");


const sendOTP = asyncHandler(async (req, res) => {
  try {
    const result = await sendOTPService(req.body.mobile);
    res.status(200).json(result);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});


const verifyOTP = asyncHandler(async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    const result = await verifyOTPService(mobile, otp);
    res.status(200).json(result);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { sendOTP, verifyOTP };
