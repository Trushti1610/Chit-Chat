import React, { useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";

const Login = ({ setSuccessMessage, setErrorMessage }) => {
  const [loginType, setLoginType] = useState("");
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const handleClick = () => {
    setShow(!show);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    
    if (!loginValue) {
      setErrorMessage(`Please enter your ${loginType || "username"}`);
      return;
    }
    if (loginType === "mobile" && loginValue.length !== 10) {
      setErrorMessage("Mobile number must be 10 digits long");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password");
      return;
    }

    setLoading(true);
    
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      const payload =
        loginType === "mobile"
          ? { mobile: loginValue, password }
          : { username: loginValue, password };

      const { data } = await axios.post("/auth/login", payload, config);

      setSuccessMessage("Login Successful");
      setErrorMessage("");
      localStorage.setItem("userInfo", JSON.stringify(data));
      setLoading(false);
      setTimeout(() => {
        history.push("/chats");
      }, 2000);
    } catch (error) {
      setSuccessMessage("");
      setErrorMessage(
        error.response?.data?.message || "Login failed. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <section className="login">
      <form className="form-group">
        <div className="input-wrapper">
          <select
            className="form-select form-control"
            value={loginType}
            onChange={(e) => setLoginType(e.target.value)}
          >
            <option value="" disabled>
              Login using
            </option>
            <option value="username" className="select-option">
              Username
            </option>
            <option value="mobile" className="select-option">
              Mobile No.
            </option>
          </select>
        </div>

        <div className="input-wrapper">
          <input
            type={loginType === "mobile" ? "tel" : "text"}
            className="form-control"
            placeholder={loginType === "mobile" ? "Mobile No." : "Username"}
            autoComplete="off"
            required
            value={loginValue}
            onChange={(e) => setLoginValue(e.target.value)}
          />
          <i
            className={`bi ${
              loginType === "mobile" ? "bi-telephone-fill" : "bi-person-fill"
            } input-icon`}
          ></i>
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
            autoComplete="current-password"
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
          onClick={submitHandler}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </section>
  );
};

export default Login;
