import React, { useState, useEffect, useRef } from "react";
import { ChatState } from "../../context/ChatProvider";
import UserBadgeItem from "../UserAvatar/UserBadgeItem";
import axios from "axios";
import UserListItem from "../UserAvatar/UserListItem";
import Toast from "../miscellaneous/Toast";
import "../../styles/modal.css";
import { capitalizeWords } from "../../config/ChatLogics";

const UpdateGroupChatModal = ({ fetchAgain, setFetchAgain, fetchMessages }) => {


  const [groupNameInput, setGroupNameInput] = useState("");
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [selectedGroupFile, setSelectedGroupFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { user, selectedChat, setSelectedChat } = ChatState();
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);


  const [isUpdateSettingsClicked, setIsUpdateSettingsClicked] = useState(false);


  const [usersToAddToGroup, setUsersToAddToGroup] = useState([]);


  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);

  useEffect(() => {
    if (selectedChat) {
      setGroupNameInput(selectedChat.chatName);
      setImagePreview(
        selectedChat.groupImage ||
          "https://icon-library.com/images/group-icon-png/group-icon-png-1.jpg"
      );
      setSelectedGroupFile(null);
    
      setIsCurrentUserAdmin(selectedChat?.adminId?._id === user?._id);
    }
  }, [selectedChat, user]);

  useEffect(() => {
    if (user && user.token) {
      fetchUsers();
    }
  }, [user, selectedChat]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get("/users", config);
      const filteredUsers = data.filter(
        (u) =>
          u._id !== user._id &&
          !selectedChat?.users?.find((groupUser) => groupUser._id === u._id)
      );
      setAllUsers(filteredUsers);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query) {
      setSearchResult([]);
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get(
        `/users/search?search=${encodeURIComponent(query)}`,
        config
      );
      setLoading(false);
      const filteredResults = data.filter(
        (searchUser) =>
          !selectedChat?.users?.find(
            (groupUser) => groupUser._id === searchUser._id
          )
      );
      setSearchResult(filteredResults);
    } catch (error) {
      setError("Failed to load the search results");
      setLoading(false);
      setSearchResult([]);
    }
  };

  const handleAddUser = async (userToAdd) => {
    if (!selectedChat) return;

    if (selectedChat.users.find((u) => u._id === userToAdd._id)) {
      setError("User already in group!");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (usersToAddToGroup.find((u) => u._id === userToAdd._id)) {
      setError("User already selected to add!");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setUsersToAddToGroup([...usersToAddToGroup, userToAdd]);
  };
  const handleRemoveUserFromAddList = (userToRemove) => {
    setUsersToAddToGroup(
      usersToAddToGroup.filter((user) => user._id !== userToRemove._id)
    );
  };

  const handleRemoveUser = async (userToRemove) => {
    if (!selectedChat || !userToRemove) return;

    if (
      selectedChat.adminId._id === user._id &&
      userToRemove._id === user._id
    ) {
      setError("Admin cannot remove themselves from the group!");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const adminIdString = selectedChat.adminId?._id || selectedChat.adminId;

    if (adminIdString !== user._id && userToRemove._id !== user._id) {
      setError("Only admins or the user themselves can remove users!");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      setUpdateLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.put(
        `/group/${selectedChat._id}/remove`,
        {
          userIds: [userToRemove._id],
        },
        config
      );

     

      if (userToRemove._id === user._id) {
        setSelectedChat(null);
      } else {
     
        const updatedGroupChat = {
          ...data.group,
          isGroupChat: true,
          users: data.group.members,
          adminId: data.group.adminId?._id || data.group.adminId,
        };
       
        setSelectedChat(updatedGroupChat);
     
      }

      setFetchAgain(!fetchAgain);
      setUpdateLoading(false);

      setSuccess(`User ${userToRemove.username} removed successfully`);
      setTimeout(() => setSuccess(""), 3000);
      fetchUsers();


      if (userToRemove._id !== user._id) {
        const closeButton = document.getElementById("closeUpdateGroupModal");
        if (closeButton) {
          closeButton.click();
        }
      }
    } catch (error) {
      setUpdateLoading(false);
      setError(
        "Error occurred while removing user from group: " +
          (error.response?.data?.message || error.message)
      );
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleAddSelectedUsers = async () => {
    setError("");
    setSuccess("");

    const adminIdString = selectedChat.adminId?._id || selectedChat.adminId;

    if (adminIdString !== user._id) {
      setError("Only admins can add users!");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      setUpdateLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const userIdsToAdd = usersToAddToGroup.map((u) => u._id);

      const { data } = await axios.put(
        `/group/${selectedChat._id}/add`,
        {
          userIds: userIdsToAdd,
        },
        config
      );

      const updatedGroupChat = {
        ...data.group,
        isGroupChat: true,
        users: data.group.members,
        adminId: data.group.adminId?._id || data.group.adminId,
      };

  
      setSelectedChat(updatedGroupChat);

      setFetchAgain(!fetchAgain);
      setUpdateLoading(false);
      setUsersToAddToGroup([]);
      setSearch("");
      setSearchResult([]);
      setSuccess("Users added to group successfully!");
      setTimeout(() => setSuccess(""), 3000);
      fetchUsers();


      const closeButton = document.getElementById("closeUpdateGroupModal");
      if (closeButton) {
        closeButton.click();
      }
    } catch (error) {
      setUpdateLoading(false);
      setError(
        "Error occurred while adding users to group: " +
          (error.response?.data?.message || error.message)
      );
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleUpdateSettings = async () => {
    if (!selectedChat) {
      return;
    }


    if (!isCurrentUserAdmin) {
      setError("Only admins can update group settings!");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (groupNameInput === selectedChat.chatName && !selectedGroupFile) {
      setError("No changes to update.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      setUpdateLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const formData = new FormData();
      formData.append("groupName", groupNameInput);

      if (selectedGroupFile) {
        formData.append("groupImage", selectedGroupFile);
      }

      const { data } = await axios.put(
        `/group/${selectedChat._id}/settings`,
        formData,
        config
      );

  
      const updatedChat = {
        ...selectedChat,
        chatName: data.data.groupName,
        groupImage: data.data.groupImage,
        users: data.data.members,
        adminId: data.data.adminId,
      };

      setSelectedChat(updatedChat);
      setFetchAgain(!fetchAgain);
      setUpdateLoading(false);
      setSuccess("Group settings updated successfully!");
      setTimeout(() => setSuccess(""), 3000);

      const closeButton = document.getElementById("closeUpdateGroupModal");
      if (closeButton) {
        closeButton.click();
      }

      setSelectedGroupFile(null);
      setImagePreview(
        data.data.groupImage ||
          "https://icon-library.com/images/group-icon-png/group-icon-png-1.jpg"
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error during group settings update:", error);
      setUpdateLoading(false);

      if (error.response?.data?.message?.includes("Group is already exists")) {
        setError(error.response.data.message);
      } else {
        setError(
          "Error occurred while updating group settings: " +
            (error.response?.data?.message || error.message)
        );
      }
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) {
      setSelectedGroupFile(null);
      setImagePreview(
        selectedChat?.groupImage ||
          "https://icon-library.com/images/group-icon-png/group-icon-png-1.jpg"
      );
      return;
    }

    if (
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/jpg"
    ) {
      setSelectedGroupFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setSelectedGroupFile(null);
      setImagePreview(
        selectedChat?.groupImage ||
          "https://icon-library.com/images/group-icon-png/group-icon-png-1.jpg"
      );
      setError("Please select an image (JPEG/PNG/JPG)!");
    }
  };

  return (
    <div>
      <div
        className="modal fade"
        id="updateGroupModal"
        tabIndex="-1"
        aria-labelledby="updateGroupModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content profile-modal">
            <div className="modal-header">
              <h5 className="modal-title" id="updateGroupModalLabel">
                Update Group:{capitalizeWords(selectedChat?.chatName)}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                id="closeUpdateGroupModal"
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
                      selectedGroupFile
                        ? imagePreview
                        : selectedChat?.groupImage ||
                          "https://icon-library.com/images/group-icon-png/group-icon-png-1.jpg"
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
                  id="updateGroupImageInput"
                  accept="image/jpeg,image/png,image/jpg"
                  ref={fileInputRef}
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="updateGroupName" className="form-label">
                  Group Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="updateGroupName"
                  placeholder="Enter new group name"
                  value={capitalizeWords(groupNameInput)}
                  onChange={(e) => setGroupNameInput(e.target.value)}
                  autoComplete="off"
                />
              </div>
            
                <button
                  className="btn btn-primary mb-3 "
                  onClick={() => {
                    handleUpdateSettings();
                    setIsUpdateSettingsClicked(true);
                  }}
                  disabled={updateLoading}
                >
                  {updateLoading ? "Updating..." : "Update Settings"}
                </button>
             
              <div className="mb-3">
                <h6>Group Members</h6>
                <div className="selected-users">
                  {/* {console.log(
                    "Rendering UserBadgeItem with users:",
                    selectedChat?.users
                  )} */}
                  {selectedChat?.users &&
                    Array.isArray(selectedChat.users) &&
                    selectedChat.users.map((u) => {
                      return (
                        <UserBadgeItem
                          key={u._id}
                          user={u}
                          handleFunction={() => handleRemoveUser(u)}
                        />
                      );
                    })}
                </div>
              </div>

              <div className="mb-3">
                <h6>Add Users</h6>
                <div className="search-container">
                  <i className="bi bi-search search-icon"></i>
                  <input
                    type="text"
                    className="form-control group-search-input"
                    placeholder="Search users to add..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    autoComplete="off"
                  />
                  {search && (
                    <i
                      className="bi bi-x-circle-fill clear-search-icon"
                      onClick={() => {
                        setSearch("");
                        setSearchResult([]);
                      }}
                    ></i>
                  )}
                </div>

                {/* Display temporarily selected users to add */}
                <div className="selected-users mt-2">
                  {usersToAddToGroup.map((u) => (
                    <UserBadgeItem
                      key={u._id}
                      user={u}
                      handleFunction={() => handleRemoveUserFromAddList(u)}
                    />
                  ))}
                </div>

                {usersToAddToGroup.length > 0 && (
                  <button
                    className="add-user-btn"
                    onClick={handleAddSelectedUsers}
                    disabled={updateLoading}
                  >
                    {updateLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Adding...
                      </>
                    ) : (
                      `Add ${usersToAddToGroup.length} Selected User${
                        usersToAddToGroup.length > 1 ? "s" : ""
                      }`
                    )}
                  </button>
                )}

                <div className="search-results">
                  {loading ? (
                    <div className="text-center">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    search &&
                    searchResult.map((user) => {
                 
                      return (
                        <UserListItem
                          key={user._id}
                          user={user}
                          handleFunction={() => handleAddUser(user)}
                        />
                      );
                    })
                  )}
                  {search && !loading && searchResult.length === 0 && (
                    <div className="text-center no-results">No users found</div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
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

export default UpdateGroupChatModal;
