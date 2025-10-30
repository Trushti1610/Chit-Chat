import React, { useState, useRef } from "react";
import { ChatState } from "../../context/ChatProvider";
import axios from "axios";
import Toast from "../miscellaneous/Toast";
import { capitalizeWords } from "../../config/ChatLogics";
import "../../styles/modal.css";

const ProfileModal = () => {
  const { user, setUser } = ChatState();
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState(
    user?.username ? capitalizeWords(user.username) : ""
  );
  const [mobile, setMobile] = useState(user?.mobile || "");
  const [status, setStatus] = useState(user?.status || "");
  const [profilePic, setProfilePic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());

  const fileInputRef = useRef(null);

  const getProfilePictureUrl = (url) => {
    if (!url)
      return "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg";
    return `${url}?t=${imageTimestamp}`;
  };

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!username || !mobile) {
      setError("Please fill all the required fields");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (mobile.length !== 10) {
      setError("Mobile number must be 10 digits long");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const hasNoChanges =
      username === capitalizeWords(user?.username) &&
      mobile === user?.mobile &&
      status === user?.status &&
      !profilePic;

    if (hasNoChanges) {
      setError("No changes to update");
      setTimeout(() => {
        setSuccess("");
        closeModal();
      }, 2000);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("username", username);
      formData.append("mobile", mobile);
      formData.append("status", status);

      if (profilePic) {
        formData.append("profileImage", profilePic);
      }

      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const token = user.token || userInfo?.token;

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      };

      const { data } = await axios.put(`/users/${user._id}`, formData, config);

 
      setImageTimestamp(Date.now());

    
      const updatedUserData = {
        ...data,
        profilePicture: getProfilePictureUrl(data.profilePicture),
      };

      localStorage.setItem("userInfo", JSON.stringify(updatedUserData));
      setUser(updatedUserData);
      setLoading(false);
      setSuccess("Profile Updated Successfully");
      setTimeout(() => {
        setSuccess("");
        closeModal();
      }, 2000);
    } catch (error) {
      setLoading(false);
      console.error("Update error:", error);
      setError(error.response?.data?.message || "Something went wrong");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) {
      setError("Please select an image!");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Please select an image less than 5MB!");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/jpg"
    ) {
      setProfilePic(file);
    } else {
      setError("Please select an image (JPEG/PNG/JPG)!");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  return (
    <>
      <div className="d-flex justify-content-start align-items-center profile-details">
        <div
          className="profile-icon"
          onClick={openModal}
          data-bs-toggle="tooltip"
          data-bs-placement="bottom"
          title="Update Profile"
        >
          <img
            src={getProfilePictureUrl(user?.profilePicture)}
            alt={capitalizeWords(user?.username) || "Profile"}
            className="profile-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg";
            }}
          />
        </div>
      </div>

      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          onClick={closeModal}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content profile-modal">
              <div className="modal-header">
                <h5 className="modal-title">Update Profile</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-4">
                  <div
                    className="profile-pic-container"
                    onClick={handleImageClick}
                  >
                    <img
                      src={
                        profilePic
                          ? URL.createObjectURL(profilePic)
                          : getProfilePictureUrl(user?.profilePicture)
                      }
                      alt={capitalizeWords(user?.username) || "Profile"}
                      className="rounded-circle profile-pic-large"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg";
                      }}
                    />

                    <div className="profile-pic-overlay">
                      <i className="bi bi-camera"></i>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleProfileUpdate}>
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label">
                      Username*
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="username"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) =>
                        setUsername(capitalizeWords(e.target.value))
                      }
                      required
                      autoComplete="off"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="mobile" className="form-label">
                      Mobile Number*
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="mobile"
                      placeholder="Enter your mobile number"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      required
                      autoComplete="off"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="status" className="form-label">
                      Status
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="status"
                      placeholder="What's on your mind?"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      autoComplete="off"
                    />
                  </div>

                  <input
                    type="file"
                    className="d-none"
                    id="profilePicture"
                    accept="image/jpeg,image/png"
                    ref={fileInputRef}
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                  />

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={closeModal}
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Updating...
                        </>
                      ) : (
                        "Update Profile"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast
        successMessage={success}
        errorMessage={error}
        setSuccessMessage={setSuccess}
        setErrorMessage={setError}
      />
    </>
  );
};

export default ProfileModal;
