import React, { useState, useEffect } from "react";
import { ChatState } from "../../context/ChatProvider";
import UserListItem from "../UserAvatar/UserListItem";
import axios from "axios";
import MyChat from "../Chat/MyChat";
import ProfileModal from "../modals/ProfileModal";
import GroupChatModal from "../modals/GroupChatModal";
import { capitalizeWords } from "../../config/ChatLogics";
import "../../styles/sidedrawer.css";
import "../../styles/notification.css";

const SideDrawer = ({
  fetchAgain,
  setFetchAgain,
  show,
  isMobileView,
  onCloseDrawer,
}) => {
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const {
    user,
    setSelectedChat,
    notification = [],
    markNotificationsAsRead,
  } = ChatState();

  const getValidNotifications = () => {
    if (!Array.isArray(notification)) return [];
    return notification.filter((n) => {
      try {
        const sender = n.senderId || n.sender;
        return (
          n &&
          sender &&
          typeof sender === "object" &&
          sender._id &&
          sender._id !== user?._id
        );
      } catch (error) {
        console.error("Error filtering notification:", error);
        return false;
      }
    });
  };

  const notificationCount = getValidNotifications().length;


  const handleSearch = async () => {
    setLoading(true);

    if (!search) {
      setSearchResult([]);
      setLoading(false);
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get(
        `/users/search?search=${encodeURIComponent(search)}`,
        config
      );
      const filteredUsers = data.filter((u) => u._id !== user._id);
      setSearchResult(filteredUsers);
    } catch (error) {
      console.log("Error searching users:", error);
      setSearchResult([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (search) {
      handleSearch();
    } else {
      setSearchResult([]);
    }
  }, [search]);


  const accessChat = async (userId) => {
    try {
      setLoadingChat(true);
      const selectedUser = searchResult.find((u) => u._id === userId);

      if (selectedUser) {
        const chatData = {
          users: [user, selectedUser],
          _id: selectedUser._id,
          isGroupChat: false,
        };

        setSelectedChat(chatData);
        if (isMobileView && onCloseDrawer) {
          onCloseDrawer();
        }
      }
      setLoadingChat(false);
    } catch (error) {
      setLoadingChat(false);
      console.log(error);
    }
  };

 
  const handleNotificationClick = async (notif) => {
    try {
      if (notif.isGroupChat) {
       
        const chatData = {
          _id: notif.chatId, 
          chatName: notif.groupInfo.groupName,
          isGroupChat: true,
          groupImage: notif.groupInfo.groupImage,
        };
        setSelectedChat(chatData);
      } else {

        const sender = notif.senderId || notif.sender;
        if (!sender?._id) {
          console.error("Invalid notification data:", notif);
          return;
        }

        const chatData = {
          _id: sender._id,
          users: [user, sender],
          isGroupChat: false,
        };
        setSelectedChat(chatData);
      }

    
      markNotificationsAsRead([notif]);
      setShowNotifications(false);
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };


  const toggleNotifications = async (enabled) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      await axios.post(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:5000"
        }/notifications/push`,
        { enabled },
        config
      );
      setNotificationsEnabled(enabled);
      if (!enabled) {
        setShowNotifications(false);
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
    }
  };

  return (
    <div className={`side-drawer ${show ? "show" : ""}`}>
      <div className="side-drawer-content">
        <div className="side-drawer-header d-flex justify-content-between align-items-center">
          <p className="side-drawer-text m-0">Chats</p>
          <div className="d-flex justify-content-between align-items-center">
            <GroupChatModal
              fetchAgain={fetchAgain}
              setFetchAgain={setFetchAgain}
            />
            <div className="notification-container">
              <div
                className="notification-icon"
                onClick={() =>
                  notificationsEnabled
                    ? setShowNotifications(!showNotifications)
                    : toggleNotifications(true)
                }
                title={
                  notificationsEnabled
                    ? "Show notifications"
                    : "Enable notifications"
                }
              >
                {notificationsEnabled ? (
                  <>
                    {notificationCount > 0 && (
                      <div className="notification-badge">
                        {notificationCount}
                      </div>
                    )}
                    <i className="bi bi-bell bell-icon"></i>
                  </>
                ) : (
                  <i className="bi bi-bell-slash bell-icon"></i>
                )}
              </div>
              {notificationsEnabled && showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h5 className="notification-title">Notifications</h5>
                    <button
                      className="notification-toggle-btn"
                      onClick={() => toggleNotifications(false)}
                      title="Disable notifications"
                    >
                      <i className="bi bi-bell-slash"></i>
                    </button>
                  </div>
                  {notificationCount === 0 ? (
                    <div className="no-notifications">No new messages</div>
                  ) : (
                    getValidNotifications().map((notif) => {
                      const sender = notif.senderId || notif.sender;
                      return (
                        <div
                          key={notif._id}
                          className="notification-item"
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div className="notification-avatar">
                            <img
                              src={
                                notif.isGroupChat
                                  ? notif.groupInfo?.groupImage ||
                                    "https://icon-library.com/images/group-icon-png/group-icon-png-1.jpg"
                                  : sender?.profilePicture ||
                                    "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
                              }
                              alt={
                                notif.isGroupChat
                                  ? notif.groupInfo?.groupName
                                  : sender?.username || "Unknown User"
                              }
                            />
                          </div>
                          <div className="notification-content">
                            <div className="notification-title">
                              {notif.isGroupChat
                                ? `${capitalizeWords(
                                    notif.groupInfo?.groupName
                                  )} - ${capitalizeWords(
                                    notif.senderId?.username
                                  )}`
                                : capitalizeWords(sender?.username) ||
                                  "Unknown User"}
                            </div>

                            <div className="d-flex justify-content-between">
                              <div className="notification-message">
                                {notif.content}
                              </div>
                              <div className="notification-time">
                                {new Date(notif.createdAt).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            <div className="profile-section">
              <ProfileModal />
            </div>
          </div>
        </div>

        <div className="search-container">
          <i className="bi bi-search search-icon"></i>
          <input
            type="text"
            className="search-input"
            placeholder="Search name or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <i
              className="bi bi-x-circle-fill clear-search-icon"
              onClick={() => setSearch("")}
            ></i>
          )}
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center">
          <div
            className="spinner-border spinner-border-sm loading-results"
            role="status"
          ></div>
        </div>
      ) : (
        searchResult.length > 0 && (
          <div className="search-results">
            {searchResult.map((user) => (
              <UserListItem
                key={user._id}
                user={user}
                handleFunction={() => accessChat(user._id)}
              />
            ))}
          </div>
        )
      )}

      {search && searchResult.length === 0 && !loading && (
        <div className="no-results">No users found</div>
      )}

      {!search && user && (
        <MyChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
      )}
    </div>
  );
};

export default SideDrawer;
