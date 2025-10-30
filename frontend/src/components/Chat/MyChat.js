import React, { useState, useEffect, useCallback } from "react";
import { ChatState } from "../../context/ChatProvider";
import axios from "axios";
import "../../styles/homePage.css"

const MyChats = ({ fetchAgain, setFetchAgain }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupDetailsLoading, setGroupDetailsLoading] = useState(false);
  const { user, selectedChat, setSelectedChat } = ChatState();


  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get(`/group`, config);
  
      setGroups(data);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);


  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get(`/users`, config);
      const filteredUsers = user
        ? data.filter((u) => u._id !== user._id)
        : data;
      setAllUsers(filteredUsers);
    } catch (error) {
      console.log("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

 
  useEffect(() => {
    if (user?.token) {
      fetchGroups();
    }
  }, [fetchAgain, user, fetchGroups]);


  useEffect(() => {
    if (user?.token) {
      fetchUsers();
    }
  }, [user, fetchUsers]);


  const startChat = (selectedUser) => {
    const chatData = {
      users: [selectedUser],
      _id: selectedUser._id, 
      isGroupChat: false,
    };

    setSelectedChat(chatData);
  };

  
  const openGroupChat = async (group) => {
    try {
      setGroupDetailsLoading(true);

      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

  

      const { data } = await axios.get(`/group/${group._id}`, config);

    

      const groupChatData = {
        ...data,
        isGroupChat: true,
        users: data.members || [],
        chatName: data.groupName,
      };

     

      setSelectedChat(groupChatData);
      setGroupDetailsLoading(false);
    } catch (error) {
      console.error(
        "Detailed error fetching group details:",
        error.response ? error.response.data : error.message
      );
      setGroupDetailsLoading(false);
    }
  };
  return (
    <div className="mychats-container">
      {/* Groups Section */}
      {groups.length > 0 && (
        <>
          <h2 className="mychats-section-title">My Groups</h2>
          <div className="groups-list">
            {groups.map((group) => (
              <div
                key={group._id}
                onClick={() => openGroupChat(group)}
                className={`group-item ${
                  selectedChat?._id === group._id ? "selected" : ""
                } ${
                  groupDetailsLoading && selectedChat?._id === group._id
                    ? "loading"
                    : ""
                }`}
              >
                <div className="group-avatar">
                  <img
                    className="avatar-img"
                    src={
                      group.groupImage ||
                      "https://icon-library.com/images/group-icon-png/group-icon-png-1.jpg"
                    }
                    alt={group.groupName}
                  />
                </div>
                <div className="user-details">
                  <p className="group-name">{group.groupName}</p>
                  <p className="members-count">
                    {group.members.length} members
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Users Section */}
      <h2 className="mychats-section-title">All Users</h2>
      {loading ? (
        <div className="d-flex justify-content-center align-items-center">
          <div
            className="spinner-border spinner-border-sm loading-results "
            role="status"
          ></div>
        </div>
      ) : allUsers.length > 0 ? (
        <div className="user-list">
          {allUsers.map((userData) => (
            <div
              key={userData._id}
              onClick={() => startChat(userData)}
              className={`user-item ${
                selectedChat?._id === userData._id && !selectedChat?.isGroupChat
                  ? "selected"
                  : ""
              }`}
            >
              <div className="user-avatar">
                <img
                  className="avatar-img"
                  src={
                    userData.profilePicture ||
                    "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
                  }
                  alt={userData.username}
                />
              </div>
              <div className="user-details">
                <p className="user-name">{userData.username}</p>
                <p className="user-status">{userData.status}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-users">No users found</div>
      )}
    </div>
  );
};

export default MyChats;
