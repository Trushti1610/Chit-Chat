import React from "react";
const Toast = ({
  successMessage,
  errorMessage,
  setSuccessMessage,
  setErrorMessage,
}) => {
  return (
    <div className="toast-container">
      {successMessage && (
        <div className="toast show text-bg-success" role="alert">
          <div className="toast-body">
            {successMessage}
            <button
              type="button"
              className="btn-close"
              onClick={() => setSuccessMessage("")}
            ></button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="toast show text-bg-danger" role="alert">
          <div className="toast-body">
            {errorMessage}
            <button
              type="button"
              className="btn-close"
              onClick={() => setErrorMessage("")}
            ></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toast;
