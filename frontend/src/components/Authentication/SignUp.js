import React, { useState, useEffect } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";

const SignUp = ({ setSuccessMessage, setErrorMessage }) => {
  const [username, setUsername] = useState(""); 
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); 
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);

  const [isTimerActive, setIsTimerActive] = useState(false);
  const history = useHistory();


  useEffect(() => {
    let timer;
    if (isTimerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
      setErrorMessage("OTP expired. Please request a new one.");
    }
    return () => clearInterval(timer);
  }, [isTimerActive, timeLeft, setErrorMessage]);

  const handleClick = () => {
    setShow(!show);
  };

  const sendOTPHandler = async (e) => {
    e.preventDefault();
    if (!username) {
      setErrorMessage("Please enter a username");
      return;
    }
    if (!mobile) {
      setErrorMessage("Please enter a mobile number");
      return;
    }
    if (mobile.length !== 10) {
      setErrorMessage("Mobile number must be 10 digits long");
      return;
    }
   
    if (!password) {
      setErrorMessage("Please enter a password");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      const { data } = await axios.post("/otp/send-otp", { mobile }, config);

      setSuccessMessage("OTP sent successfully");
      setErrorMessage("");
      setStep(2); 
      setLoading(false);
      setTimeLeft(60);
      setIsTimerActive(true); 

      if (data.otp) {
        setOtp(data.otp);
      }
    } catch (error) {
      setSuccessMessage("");
      setErrorMessage(
        error.response?.data?.message || "Failed to send OTP. Please try again."
      );
      setLoading(false);
    }
  };

  const verifyOTPHandler = async (e) => {
    e.preventDefault();
    if (!otp) {
      setErrorMessage("Please enter the OTP");
      return;
    }
    if (timeLeft === 0) {
      setErrorMessage("OTP has expired. Please request a new one.");
      return;
    }

    setLoading(true);
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      await axios.post("/otp/verify-otp", { mobile, otp }, config);

      const { data } = await axios.post(
        "/auth/register",
        { username, mobile, password }, 
        config
      );

      setSuccessMessage("Registration Successful");
      setErrorMessage("");
      localStorage.setItem("userInfo", JSON.stringify(data));
      setLoading(false);
      setTimeout(() => {
        history.push("/chats");
      }, 2000);
    } catch (error) {
      setSuccessMessage("");
      setErrorMessage(
        error.response?.data?.message ||
          "Verification failed. Please try again."
      );
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <section className="signup">
      {step === 1 ? (
        <form className="form-group">
          <div className="input-wrapper">
            <input
              type="text"
              className="form-control"
              id="username"
              placeholder="Username"
              autoComplete="off"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <i className="bi bi-person-fill input-icon"></i>
          </div>
          <div className="input-wrapper">
            <input
              type="tel"
              className="form-control"
              id="mobile"
              placeholder="Mobile No."
              autoComplete="off"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
            <i className="bi bi-telephone-fill input-icon"></i>
          </div>
          <div className="input-wrapper">
            <input
              type={show ? "text" : "password"}
              className="form-control"
              id="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <i
              onClick={handleClick}
              className={`bi ${
                show ? "bi-eye-slash-fill" : "bi-eye-fill"
              } input-icon`}
            ></i>
          </div>
          <button
            type="button"
            className="submit-btn"
            onClick={sendOTPHandler}
            disabled={loading}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      ) : (
        <form className="form-group">
          <div className="input-wrapper">
            <input
              type="text"
              className="form-control"
              id="otp"
              placeholder="Enter OTP"
              autoComplete="off"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
            />
            <i className="bi bi-shield-lock-fill input-icon"></i>
          </div>
          <div className="timer-text">
            Time remaining: {formatTime(timeLeft)}
          </div>
          <button
            type="button"
            className="submit-btn"
            onClick={verifyOTPHandler}
            disabled={loading || timeLeft === 0}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          <p className="mt-2 text-center mb-0">
            Didn't receive OTP?
            <p
              className="try-link m-0"
              onClick={() => {
                setStep(1);
                setTimeLeft(60);
                setIsTimerActive(false);
              }}
            >
              Try again
            </p>
          </p>
        </form>
      )}
    </section>
  );
};

export default SignUp;
