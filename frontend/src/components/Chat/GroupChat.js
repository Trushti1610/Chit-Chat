import { useState, useEffect, useRef, useCallback } from "react";
import { ChatState } from "../../context/ChatProvider";
import axios from "axios";
import ScrollableChat from "./ScrollableChat";
import io from "socket.io-client";
import animationData from "../../animation/typing.json";
import UpdateGroupChatModal from "../modals/UpdateGroupChatModal";
import { capitalizeWords } from "../../config/ChatLogics";
import "../../styles/modal.css";

import * as bootstrap from "bootstrap";

const ENDPOINT = process.env.REACT_APP_API_URL || "http://localhost:5000";
let socket;
let selectedChatCompare;

const GroupChat = ({
  fetchAgain,
  setFetchAgain,
  toggleSideDrawer,
  isMobileView,
}) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const [groupInfo, setGroupInfo] = useState(null);
  const [onlineMembers, setOnlineMembers] = useState(new Set());

  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMessages, setFilteredMessages] = useState([]);

  const lastTypingTimeRef = useRef(null);
  const messagesEndRef = useRef(null);
  const prevSelectedChatRef = useRef(null);
  const isMountedRef = useRef(true);

  const {
    user,
    selectedChat,
    notification,
    setNotification,
    markNotificationsAsRead,
  } = ChatState();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const markGroupMessageAsDelivered = useCallback(
    (messageId) => {
      if (socket && selectedChat) {
        socket.emit("group message status", {
          messageId,
          groupId: selectedChat._id,
          status: "delivered",
        });
      }
    },
    [socket, selectedChat]
  );

  const markGroupMessageAsRead = useCallback(
    (messageId) => {
      if (socket && selectedChat) {
        socket.emit("group message status", {
          messageId,
          groupId: selectedChat._id,
          status: "read",
        });
      }
    },
    [socket, selectedChat]
  );


  const fetchGroupMessages = useCallback(async () => {
    if (!selectedChat || !selectedChat._id || !isMountedRef.current) {
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      setLoading(true);

      const { data } = await axios.get(
        `/groupsMsg/${selectedChat._id}/fetchmessages`,
        config
      );

      if (isMountedRef.current) {
        setMessages(data);

        socket.emit("join group", selectedChat._id);

        
        data.forEach((message) => {
          if (message.senderId._id !== user._id) {
          
            if (!message.deliveredTo?.includes(user._id)) {
              markGroupMessageAsDelivered(message._id);
            }
           
            if (
              message.deliveredTo?.includes(user._id) &&
              !message.readBy?.includes(user._id)
            ) {
              markGroupMessageAsRead(message._id);
            }
          }
        });

        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching group messages:", error);
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [
    selectedChat?._id,
    user?.token,
    markGroupMessageAsDelivered,
    markGroupMessageAsRead,
  ]);

  const fetchGroupDetails = useCallback(async () => {
    if (!selectedChat || !selectedChat._id || !isMountedRef.current) {
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get(`/group/${selectedChat._id}`, config);

      if (isMountedRef.current) {
        setGroupInfo(data);
      }
    } catch (error) {
      console.error(
        "Detailed error in fetchGroupDetails:",
        error.response ? error.response.data : error.message
      );
    }
  }, [selectedChat?._id, user?.token]);

  useEffect(() => {
    if (!socket) {
      socket = io(ENDPOINT, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });
    }

    if (user) {
      socket.emit("setup", user);

      socket.on("connect", () => {
        console.log("Socket connected successfully");
        setSocketConnected(true);
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setSocketConnected(false);
      });

      socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        setSocketConnected(false);
      });

      socket.on("reconnect", (attemptNumber) => {
        console.log("Socket reconnected after", attemptNumber, "attempts");
        setSocketConnected(true);
    
        if (selectedChat?._id) {
          socket.emit("join group", selectedChat._id);
        }
      });

      socket.on("reconnect_error", (error) => {
        console.error("Socket reconnection error:", error);
      });

      socket.on("reconnect_failed", () => {
        console.error("Socket reconnection failed after all attempts");
      });
    }


    isMountedRef.current = true;


    return () => {
      isMountedRef.current = false;
      if (socket) {
        socket.off("connect");
        socket.off("connect_error");
        socket.off("disconnect");
        socket.off("reconnect");
        socket.off("reconnect_error");
        socket.off("reconnect_failed");
        socket.disconnect();
      }
    };
  }, [user, selectedChat?._id]);

 
  const checkSocketConnection = useCallback(() => {
    if (socket && !socket.connected) {
      console.log("Attempting to reconnect socket...");
      socket.connect();
    }
  }, [socket]);

  
  useEffect(() => {
    const intervalId = setInterval(checkSocketConnection, 5000);
    return () => clearInterval(intervalId);
  }, [checkSocketConnection]);

  const handleGroupMessageReceived = useCallback(
    (newMessageReceived) => {
      if (!isMountedRef.current) return;

      console.log("handleGroupMessageReceived received:", newMessageReceived);

     
      if (
        selectedChat &&
        selectedChat._id === newMessageReceived.groupId?._id
      ) {
        console.log("Received message for current group chat.");

       
        setMessages((prevMessages) => [...prevMessages, newMessageReceived]);

        if (newMessageReceived.senderId._id !== user._id) {
      
          if (!newMessageReceived.deliveredTo?.includes(user._id)) {
            socket.emit("group message status", {
              messageId: newMessageReceived._id,
              groupId: newMessageReceived.groupId._id,
              status: "delivered",
            });
          }

          if (
            newMessageReceived.deliveredTo?.includes(user._id) &&
            !newMessageReceived.readBy?.includes(user._id)
          ) {
            setTimeout(() => {
              socket.emit("group message status", {
                messageId: newMessageReceived._id,
                groupId: newMessageReceived.groupId._id,
                status: "read",
              });
            }, 1000);
          }
        }
      }
    },
    [selectedChat, user, socket]
  );


  const handleTyping = useCallback(
    (data) => {
      if (!isMountedRef.current) return;

      if (selectedChat && selectedChat._id === data.groupId) {
        setIsTyping(true);
      }
    },
    [selectedChat]
  );

  const handleStopTyping = useCallback(
    (data) => {
      if (!isMountedRef.current) return;

      if (selectedChat && selectedChat._id === data.groupId) {
        setIsTyping(false);
      }
    },
    [selectedChat]
  );

  
  const handleGroupUpdated = useCallback(
    (updatedGroup) => {
      if (!isMountedRef.current) return;

      if (selectedChat && selectedChat._id === updatedGroup._id) {
        setGroupInfo(updatedGroup);

        if (updatedGroup.members?.length !== selectedChat.members?.length) {
          setFetchAgain(!fetchAgain);
        }
      }
    },
    [selectedChat, fetchAgain, setFetchAgain]
  );

  const handleUserOnline = useCallback((userId) => {
    if (!isMountedRef.current) return;

    setOnlineMembers((prev) => new Set([...prev, userId]));
  }, []);

  const handleUserOffline = useCallback((userId) => {
    if (!isMountedRef.current) return;

    setOnlineMembers((prev) => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  }, []);


  const handleUserJoinedGroup = useCallback(
    ({ groupId }) => {
      if (!isMountedRef.current) return;

      if (selectedChat && selectedChat._id === groupId) {
        fetchGroupDetails();
      }
    },
    [selectedChat, fetchGroupDetails]
  );

  const handleUserLeftGroup = useCallback(
    ({ groupId }) => {
      if (!isMountedRef.current) return;

      if (selectedChat && selectedChat._id === groupId) {
        fetchGroupDetails();
      }
    },
    [selectedChat, fetchGroupDetails]
  );


  const handleGroupMessageStatusUpdate = useCallback(
    (data) => {
   
      setMessages((prevMessages) =>
        prevMessages.map((message) =>
          message._id === data.messageId
            ? {
                ...message,
                deliveredTo: data.deliveredTo || message.deliveredTo || [],
                readBy: data.readBy || message.readBy || [],
              }
            : message
        )
      );


      if (data.groupId === selectedChat?._id) {
        setNotification((prev) =>
          prev.map((n) =>
            n._id === data.messageId
              ? {
                  ...n,
                  deliveredTo: data.deliveredTo || n.deliveredTo || [],
                  readBy: data.readBy || n.readBy || [],
                }
              : n
          )
        );
      }
    },
    [selectedChat?._id]
  );


  const markMessagesAsRead = useCallback(() => {
    if (!selectedChat || !socket) return;

    messages.forEach((message) => {
      if (message.senderId._id !== user._id && message.status !== "read") {
   
        if (message.status === "sent") {
          socket.emit("group message status", {
            messageId: message._id,
            groupId: selectedChat._id,
            status: "delivered",
          });
        }


        socket.emit("group message status", {
          messageId: message._id,
          groupId: selectedChat._id,
          status: "read",
        });
      }
    });
  }, [selectedChat, socket, messages, user._id]);


  useEffect(() => {
    if (!socket) return;

 
    socket.on("group message received", handleGroupMessageReceived);
    socket.on("group message status updated", handleGroupMessageStatusUpdate);
    socket.on("typing", handleTyping);
    socket.on("stop typing", handleStopTyping);
    socket.on("group updated", handleGroupUpdated);
    socket.on("user online", handleUserOnline);
    socket.on("user offline", handleUserOffline);
    socket.on("user joined group", handleUserJoinedGroup);
    socket.on("user left group", handleUserLeftGroup);


    return () => {
      socket.off("group message received", handleGroupMessageReceived);
      socket.off(
        "group message status updated",
        handleGroupMessageStatusUpdate
      );
      socket.off("typing", handleTyping);
      socket.off("stop typing", handleStopTyping);
      socket.off("group updated", handleGroupUpdated);
      socket.off("user online", handleUserOnline);
      socket.off("user offline", handleUserOffline);
      socket.off("user joined group", handleUserJoinedGroup);
      socket.off("user left group", handleUserLeftGroup);
    };
  }, [
    socket,
    handleGroupMessageReceived,
    handleGroupMessageStatusUpdate,
    handleTyping,
    handleStopTyping,
    handleGroupUpdated,
    handleUserOnline,
    handleUserOffline,
    handleUserJoinedGroup,
    handleUserLeftGroup,
  ]);


  useEffect(() => {
    if (selectedChat && selectedChat.isGroupChat) {
     
      setTimeout(() => {
        markMessagesAsRead();
      }, 1000);
    }
  }, [selectedChat, markMessagesAsRead]);


  useEffect(() => {
    if (!selectedChat || !selectedChat.isGroupChat || !isMountedRef.current)
      return;


    if (prevSelectedChatRef.current === selectedChat._id) return;

    prevSelectedChatRef.current = selectedChat._id;

    const loadGroupData = async () => {

      setMessages([]);


      if (selectedChatCompare && selectedChatCompare._id !== selectedChat._id) {
        socket.emit("leave group", selectedChatCompare._id);
      }

   
      selectedChatCompare = selectedChat;


      await fetchGroupMessages();
      await fetchGroupDetails();


      if (messages.length > 0) {
        messages.forEach((message) => {
          if (message.senderId._id !== user._id && message.status !== "read") {
            socket.emit("group message status", {
              messageId: message._id,
              groupId: selectedChat._id,
              status: "read",
            });
          }
        });
      }
    };

    loadGroupData();

    return () => {
      if (selectedChatCompare) {
        socket.emit("leave group", selectedChatCompare._id);
      }
    };
  }, [selectedChat, fetchGroupMessages, fetchGroupDetails, messages, user._id]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

 
  const sendGroupMessage = async (event) => {
    if ((event.key === "Enter" || event.type === "click") && newMessage) {
      if (event.key === "Enter") {
        event.preventDefault();
      }

 
      if (!socketConnected) {
        console.log("Socket not connected, attempting to reconnect...");
        checkSocketConnection();
        return;
      }

      socket.emit("stop typing in group", { groupId: selectedChat._id });

      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };

        const messageContent = newMessage.trim();
        setNewMessage("");

        const messageData = {
          message: messageContent,
          type: "text",
        };

        const { data } = await axios.post(
          `/groupsMsg/${selectedChat._id}/messages`,
          messageData,
          config
        );

        if (socketConnected) {
          socket.emit("new group message", {
            ...data,
            groupId: selectedChat._id,
          });
        }
      } catch (error) {
        console.error("Error sending group message:", error);
        checkSocketConnection();
      }
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing in group", { groupId: selectedChat._id });
    }

    lastTypingTimeRef.current = new Date().getTime();
    const timerLength = 3000;

    setTimeout(() => {
      const timeNow = new Date().getTime();
      const timeDiff = timeNow - lastTypingTimeRef.current;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing in group", { groupId: selectedChat._id });
        setTyping(false);
      }
    }, timerLength);
  };

 
  useEffect(() => {
    if (selectedChat && selectedChat.isGroupChat && notification.length > 0) {
    
      const groupNotifs = notification.filter(
        (n) => n.isGroupChat && n.chatId === selectedChat._id
      );
      if (groupNotifs.length > 0) {
        markNotificationsAsRead(groupNotifs);
      }
    }
  }, [selectedChat, notification, markNotificationsAsRead]);


  useEffect(() => {
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = messages.filter(
        (msg) =>
         
          (msg.content && msg.content.toLowerCase().includes(lowerCaseQuery)) ||
          (msg.message && msg.message.toLowerCase().includes(lowerCaseQuery))
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages([]); 
    }
  }, [searchQuery, messages]);

  const displayInfo = groupInfo || selectedChat;
  const isAdmin =
    user._id === (displayInfo.adminId?._id || displayInfo.adminId);

  return (
    <div className="single-chat-attractive-container">
      <div
        className="group-chat-header
        d-flex
        align-items-center
        justify-content-between "
      >
        {isMobileView && (
          <div className="back-button" onClick={toggleSideDrawer}>
            <i className="bi bi-arrow-left"></i>
          </div>
        )}
        <div className="d-flex align-items-center gap-3">
          <div className="sender-avatar">
            <img
              src={
                displayInfo?.groupImage ||
                "https://icon-library.com/images/group-icon-png/group-icon-png-1.jpg"
              }
              alt="Group"
              className="sender-avatar-img"
            />
          </div>

          <div className="sender-details">
            <h2 className="sender-name d-flex">
              <div> {displayInfo?.groupName || displayInfo?.chatName}</div>
            </h2>

            <div className="group-info">
              <span className="sender-status">
                {displayInfo?.members
                  ?.map((member) => capitalizeWords(member.username))
                  .join(", ")}
              </span>
              <br />
            </div>
          </div>
        </div>
        <div
          className="search-icon search-message-icon"
          onClick={() => setShowSearchInput(!showSearchInput)}
          title="Search messages"
        >
          <i className="bi bi-search single-chat-search-icon"></i>
        </div>

        {isAdmin && (
          <i
            className="bi bi-pencil-square pencil-icon"
            style={{ cursor: "pointer", fontSize: "1.5rem" }}
            title="Edit Group"
            data-bs-toggle="modal"
            data-bs-target="#updateGroupModal"
          ></i>
        )}
      </div>

      {loading ? (
        <div className="loading-screen d-flex justify-content-center align-items-center">
          <div
            className="spinner-border spinner-border-sm loading-message"
            role="status"
          ></div>
        </div>
      ) : (
        <div
          className={`messages-container${
            showSearchInput ? " search-active-messages" : ""
          }`}
        >
          <ScrollableChat
            messages={searchQuery ? filteredMessages : messages} 
            isGroupChat={true}
            isTyping={istyping}
          />
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Search Input Area */}
      {showSearchInput && (
        <div className="message-search-area">
          <input
            type="text"
            placeholder="Search messages..."
            className="form-control search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={() => setShowSearchInput(false)}
          >
            &times;
          </button>
        </div>
      )}
      <div className="message-input-attractive-container">
        {/* {istyping && (
            <div className="typing-indicator">
              <Lottie
                options={defaultOptions}
                width={70}
                style={{ marginBottom: 15, marginLeft: 0 }}
              />
            </div>
          )} */}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendGroupMessage({ type: "click" });
          }}
          className="simple-message-form-row"
        >
          <input
            type="text"
            placeholder="Enter a message..."
            onChange={typingHandler}
            onKeyDown={sendGroupMessage}
            value={newMessage}
            className="simple-message-input"
          />
          <button
            type="button"
            className="input-icon-right"
            onClick={() => sendGroupMessage({ type: "click" })}
            disabled={!newMessage.trim()}
            aria-label="Send"
          >
            <i className="bi bi-send"></i>
          </button>
        </form>
      </div>
      <div>
        <UpdateGroupChatModal
          fetchAgain={fetchAgain}
          setFetchAgain={setFetchAgain}
          fetchMessages={fetchGroupMessages}
        />
      </div>
    </div>
  );
};

export default GroupChat;
