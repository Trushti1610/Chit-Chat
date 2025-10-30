import React, { useState, useEffect, useRef } from "react";
import { ChatState } from "../../context/ChatProvider";
import axios from "axios";
import UserListItem from "../UserAvatar/UserListItem";
import UserBadgeItem from "../UserAvatar/UserBadgeItem";
import Toast from "../miscellaneous/Toast";
import { capitalizeWords } from "../../config/ChatLogics";

const GroupChatModal = ({ fetchAgain, setFetchAgain }) => {
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroupFile, setSelectedGroupFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { user, setSelectedChat } = ChatState();
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user && user.token) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get("/users", config);

  
      const filteredUsers = data.filter((u) => u._id !== user._id);
      setAllUsers(filteredUsers);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearch(query);
    if (!query) {
      setSearchResults([]);
      return;
    }

    const results = allUsers.filter(
      (searchUser) =>
        searchUser.username?.toLowerCase().includes(query.toLowerCase()) ||
        searchUser.phone?.includes(query)
    );

    setSearchResults(results);
  };

  const handleAddUser = (userToAdd) => {
    if (selectedUsers.some((user) => user._id === userToAdd._id)) {
      return; 
    }

    setSelectedUsers([...selectedUsers, userToAdd]);
    setSearch("");
    setSearchResults([]);
  };

  const handleRemoveUser = (userToRemove) => {
    setSelectedUsers(
      selectedUsers.filter((user) => user._id !== userToRemove._id)
    );
  };

  const handleFileSelect = (file) => {
    if (!file) {
      setSelectedGroupFile(null);
      setImagePreview(null);
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
      setSelectedGroupFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError("");
    } else {
      setSelectedGroupFile(null);
      setImagePreview(null);
      setError("Please select an image (JPEG/PNG/JPG)!");
      setTimeout(() => setError(""), 3000);
    }
  };

  const resetForm = () => {
    setGroupName("");
    setSelectedUsers([]);
    setSearch("");
    setSearchResults([]);
    setSelectedGroupFile(null);
    setImagePreview(null);
    setError("");
    setSuccess("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!groupName.trim()) {
      setError("Please enter a group name");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (selectedUsers.length < 1) {
      setError("Please add at least one member to the group");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("groupName", groupName);
      selectedUsers.forEach((user) => {
        formData.append("members[]", user._id);
      });

      if (selectedGroupFile) {
        formData.append("groupImage", selectedGroupFile);
      }

      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post("/group", formData, config);

      resetForm();
      document.getElementById("closeGroupModal").click();

      setSelectedChat({
        _id: data._id,
        chatName: data.groupName,
        isGroupChat: true,
        users: data.members,
        groupAdmin: { _id: data.adminId },
        groupImage: data.groupImage,
      });

      setLoading(false);

      if (setFetchAgain) {
        setFetchAgain((prev) => !prev);
      }

      setSuccess("Group created successfully!");
    } catch (error) {
      setLoading(false);
      setError(error.response?.data?.message || error.message);
      console.error("Error creating group:", error);
    }
  };

  return (
    <div>
      <div
        data-bs-toggle="tooltip"
        data-bs-placement="bottom"
        title="New Group"
      >
        <div
          type="button"
          data-bs-toggle="modal"
          data-bs-target="#groupChatModal"
        >
          <i className="bi bi-people group-icon" title="New Group"></i>
        </div>
      </div>

      <div
        className="modal fade"
        id="groupChatModal"
        tabIndex="-1"
        aria-labelledby="groupChatModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content profile-modal">
            <div className="modal-header">
              <h5 className="modal-title" id="groupChatModalLabel">
                Create New Group
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                id="closeGroupModal"
                onClick={resetForm}
              ></button>
            </div>
            <div className="modal-body">
              <div className="mb-3 text-center">
                <div
                  className="profile-pic-container"
                  onClick={() => fileInputRef.current.click()}
                >
                  <img
                    src={
                      imagePreview
                        ? imagePreview
                        : "https://icon-library.com/images/group-icon-png/group-icon-png-1.jpg"
                    }
                    alt="Group Preview"
                    className="rounded-circle profile-pic-large"
                  />
                  <div className="profile-pic-overlay">
                    <i className="bi bi-camera"></i>
                  </div>
                </div>
                <input
                  type="file"
                  className="d-none"
                  id="groupImageInput"
                  accept="image/jpeg,image/png,image/jpg"
                  ref={fileInputRef}
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="groupName" className="form-label">
                  Group Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="groupName"
                  placeholder="Enter group name"
                  value={capitalizeWords(groupName)}
                  onChange={(e) =>
                    setGroupName(capitalizeWords(e.target.value))
                  }
                  autoComplete="off"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="memberSearch" className="form-label">
                  Add Members
                </label>
                <div className="search-container group-search-conatiner">
                  <i className="bi bi-search search-icon"></i>
                  <input
                    type="text"
                    className="form-control group-search-input"
                    id="memberSearch"
                    placeholder="Search by name or phone no."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    autoComplete="off"
                  />
                  {search && (
                    <i
                      className="bi bi-x-circle-fill clear-search-icon"
                      onClick={() => {
                        setSearch("");
                        setSearchResults([]);
                      }}
                    ></i>
                  )}
                </div>
              </div>

              <div className="selected-users">
                {selectedUsers.map((user) => (
                  <UserBadgeItem
                    key={user._id}
                    user={user}
                    handleFunction={() => handleRemoveUser(user)}
                  />
                ))}
              </div>

              <div className="search-results">
                {loading ? (
                  <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  search &&
                  searchResults.map((user) => (
                    <UserListItem
                      key={user._id}
                      user={user}
                      handleFunction={() => handleAddUser(user)}
                    />
                  ))
                )}
                {search && !loading && searchResults.length === 0 && (
                  <div className="text-center  no-results">No users found</div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={resetForm}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Creating...
                  </>
                ) : (
                  "Create Group"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Toast
        successMessage={success}
        errorMessage={error}
        setSuccessMessage={setSuccess}
        setErrorMessage={setError}
      />
    </div>
  );
};

export default GroupChatModal;
