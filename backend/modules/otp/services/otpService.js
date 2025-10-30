const User = require("../../../models/userModel");
const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
// console.log("SID:", accountSid);
// console.log("Token exists:", !!authToken);
// console.log("Phone number:", twilioPhoneNumber);
if (!accountSid || !authToken) {
  console.error("Twilio credentials are missing from environment variables");
}

const twilioClient = new twilio.Twilio(accountSid, authToken);
const otpStorage = new Map();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const setOTPWithExpiry = (mobile, otp) => {
  otpStorage.set(mobile, {
    code: otp,
    expiry: Date.now() + 1 * 60 * 1000,
  });

  setTimeout(() => {
    otpStorage.delete(mobile);
  }, 1 * 60 * 1000);
};

const validateOTP = (mobile, otp) => {
  const otpData = otpStorage.get(mobile);
  if (!otpData) return false;

  if (otpData.expiry < Date.now()) {
    otpStorage.delete(mobile);
    return false;
  }

  return otpData.code === otp;
};

const sendSMS = async (to, body) => {
  try {
    const formattedNumber = to.startsWith("+") ? to : `+91${to}`;

    const message = await twilioClient.messages.create({
      body: body,
      from: twilioPhoneNumber,
      to: formattedNumber,
    });
    console.log("SMS sent successfully. SID:", message.sid);
    return true;
  } catch (error) {
    console.error("Error sending SMS:", error);
    return false;
  }
};

const sendOTPService = async (mobile) => {
  if (!mobile) {
    throw new Error("Mobile number is required");
  }

  const otp = generateOTP();
  setOTPWithExpiry(mobile, otp);

  const smsBody = `Your ChitChat verification code is: ${otp}. Valid for 1 minutes.`;
  const smsSent = await sendSMS(mobile, smsBody);

  if (!smsSent) {
    throw new Error("Failed to send OTP via SMS. Please try again.");
  }

  return {
    message: "OTP sent successfully to your mobile number",
    ...(process.env.NODE_ENV === "development" && { otp: otp }),
  };
};

const verifyOTPService = async (mobile, otp) => {
  if (!mobile || !otp) {
    throw new Error("Mobile number and OTP are required");
  }
  const isValid = validateOTP(mobile, otp);

  if (!isValid) {
    throw new Error("Invalid OTP");
  }
  otpStorage.delete(mobile);
  return {
    success: true,
    message: "OTP verified successfully",
  };
};

module.exports = {
  sendOTPService,
  verifyOTPService,
};
