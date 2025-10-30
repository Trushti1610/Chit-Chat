import React, { useState } from "react";
import Login from "../components/Authentication/Login";
import SignUp from "../components/Authentication/SignUp";
import Toast from "../components/miscellaneous/Toast";
import "../styles/homePage.css";

const HomePage = () => {
  const [activeComponent, setActiveComponent] = useState("login");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const toggleComponent = () => {
    setActiveComponent(activeComponent === "login" ? "signup" : "login");
  };

  return (
    <section className="home">
      <div className="container">
        <div className="home-content">
          <div className="home-card">
            <h3 className="main-heading">Welcome to ChitChat</h3>
            <div className="tab-content">
              {activeComponent === "login" ? (
                <div className="login-container">
                  <Login
                    setSuccessMessage={setSuccessMessage}
                    setErrorMessage={setErrorMessage}
                  />
                  <p className="text-center mt-3 primary-text">
                    New User?{" "}
                    <span className="signup-link" onClick={toggleComponent}>
                      Sign up
                    </span>
                  </p>
                </div>
              ) : (
                <div className="signup-container">
                  <SignUp
                    setSuccessMessage={setSuccessMessage}
                    setErrorMessage={setErrorMessage}
                  />
                  <p className="text-center mt-3 primary-text">
                    Already have an account?{" "}
                    <span
                      className="login-link underline"
                      onClick={toggleComponent}
                    >
                      Login
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Toast
        successMessage={successMessage}
        errorMessage={errorMessage}
        setSuccessMessage={setSuccessMessage}
        setErrorMessage={setErrorMessage}
      />
    </section>
  );
};

export default HomePage;
