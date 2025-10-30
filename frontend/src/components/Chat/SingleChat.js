import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChatState } from "../../context/ChatProvider";
import axios from "axios";
import ScrollableChat from "./ScrollableChat";
import io from "socket.io-client";

import animationData from "../../animation/typing.json";

const ENDPOINT = process.env.REACT_APP_API_URL || "http://localhost:5000";

const SingleChat = ({ toggleSideDrawer, isMobileView }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const lastTypingTimeRef = useRef(null);
  const messagesEndRef = useRef(null);
  const selectedChatRef = useRef();
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [otherUserLastSeen, setOtherUserLastSeen] = useState(null);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMessages, setFilteredMessages] = useState([]);

  const { user, selectedChat, socket } = ChatState();

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = messages.filter((msg) =>
        msg.message.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages([]);
    }
  }, [searchQuery, messages]);

  const getSenderUser = useCallback(() => {
    const currentChat = selectedChatRef.current;
    if (
      !currentChat ||
      !currentChat.users ||
      currentChat.isGroupChat ||
      !user
    ) {
      return null;
    }
    return currentChat.users.find((u) => u && u._id !== user._id);
  }, [user]);

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();

    const diffInMinutes = Math.round((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    if (diffInMinutes < 60 * 24)
      return `${Math.round(diffInMinutes / 60)} hours ago`;

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return `yesterday at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const checkUserStatus = useCallback(
    async (userId) => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        const { data } = await axios.get(`/users/status/${userId}`, config);
        setIsOtherUserOnline(data.isOnline);
        setOtherUserLastSeen(data.lastSeen);
      } catch (error) {
        console.error("Error checking user status:", error);
      }
    },
    [user, setIsOtherUserOnline, setOtherUserLastSeen]
  );

  const markMessagesAsRead = useCallback(async () => {
    const currentChat = selectedChatRef.current;
    if (!user || !messages.length || !currentChat || currentChat.isGroupChat) {
      return;
    }

    const otherUser = currentChat.users.find((u) => u._id !== user._id);
    if (!otherUser) return;

   
    const unreadMessages = messages.filter(
      (msg) =>
        msg.senderId._id === otherUser._id &&
        msg.receiverId._id === user._id &&
        msg.status !== "read"
    );

    if (unreadMessages.length > 0) {
     
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (
            msg.senderId._id === otherUser._id &&
            msg.receiverId._id === user._id &&
            msg.status !== "read"
          ) {
            return { ...msg, status: "read" };
          }
          return msg;
        })
      );

     
      if (socket && socket.connected) {
        unreadMessages.forEach((msg) => {
          socket.emit("message read", {
            messageId: msg._id,
            senderId: msg.senderId._id,
          });
        });
      }
    }
  }, [user, messages, socket]);

  const handleSoftDeleteMessage = useCallback(
    async (messageId) => {
      try {

        const deletedMessages = JSON.parse(
          localStorage.getItem("deletedMessages") || "[]"
        );

      
        if (!deletedMessages.includes(messageId)) {
          deletedMessages.push(messageId);
          localStorage.setItem(
            "deletedMessages",
            JSON.stringify(deletedMessages)
          );
        }

   
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg._id !== messageId)
        );
      } catch (error) {
        console.error("Error soft deleting message:", error);
      }
    },
    [setMessages]
  );


  const filterDeletedMessages = useCallback((messages) => {
    const deletedMessages = JSON.parse(
      localStorage.getItem("deletedMessages") || "[]"
    );
    return messages.filter((msg) => !deletedMessages.includes(msg._id));
  }, []);

  const messageReceivedHandler = useCallback((newMessage) => {
    const currentChat = selectedChatRef.current;
    if (!currentChat || currentChat.isGroupChat) return;
    const sender = newMessage.senderId;
    if (currentChat.users.some((u) => u._id === sender._id)) {
      setMessages((prev) => [...prev, newMessage]);
    }
  }, []);

  const messageStatusUpdatedHandler = useCallback(({ messageId, status }) => {
    setMessages((prev) =>
      prev.map((msg) => (msg._id === messageId ? { ...msg, status } : msg))
    );
  }, []);

  const messageDeliveredHandler = useCallback(({ messageId }) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === messageId ? { ...msg, status: "delivered" } : msg
      )
    );
  }, []);

  const handleUserOnline = useCallback(({ userId, isOnline }) => {
    const currentChat = selectedChatRef.current;
    if (!currentChat || currentChat.isGroupChat) return;

    if (currentChat.users.some((u) => u._id === userId)) {
      setIsOtherUserOnline(isOnline);
      if (!isOnline) {
        setOtherUserLastSeen(new Date().toISOString());
      }
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    const currentChat = selectedChatRef.current;
    if (!currentChat || currentChat.isGroupChat) {
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      setLoading(true);
      const otherUser = currentChat.users.find((u) => u._id !== user._id);
      if (!otherUser) {
        console.error("Other user not found in chat");
        setLoading(false);
        return;
      }

      const { data: messagesData } = await axios.get(
        `/messages/${otherUser._id}`,
        config
      );

     
      setMessages(filterDeletedMessages(messagesData));

   
      if (messagesData.length > 0) {
        const unreadMessages = messagesData.filter(
          (msg) =>
            msg.senderId._id === otherUser._id &&
            msg.receiverId._id === user._id &&
            msg.status !== "read"
        );

        if (unreadMessages.length > 0 && socket && socket.connected) {
          unreadMessages.forEach((msg) => {
            socket.emit("message read", {
              messageId: msg._id,
              senderId: msg.senderId._id,
            });
          });
        }
      }

      if (socket && socket.connected) {
        const roomId = [user._id, otherUser._id].sort().join("_");
        socket.emit("join chat", roomId);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setLoading(false);
    }
  }, [user, socket, filterDeletedMessages]);

  useEffect(() => {
    if (!socket || !user) return;


    socket.on("message received", messageReceivedHandler);
    socket.on("message status updated", messageStatusUpdatedHandler);
    socket.on("message delivered", messageDeliveredHandler);
    socket.on("user online", handleUserOnline);
    socket.on("typing", (data) => {
      const currentChat = selectedChatRef.current;
      if (
        currentChat &&
        data.senderId &&
        currentChat.users.some((u) => u && u._id === data.senderId)
      ) {
        setIsTyping(true);
      }
    });
    socket.on("stop typing", (data) => {
      const currentChat = selectedChatRef.current;
      if (
        currentChat &&
        data.senderId &&
        currentChat.users.some((u) => u && u._id === data.senderId)
      ) {
        setIsTyping(false);
      }
    });

    return () => {
      if (socket) {
        socket.off("message received", messageReceivedHandler);
        socket.off("message status updated", messageStatusUpdatedHandler);
        socket.off("message delivered", messageDeliveredHandler);
        socket.off("user online", handleUserOnline);
        socket.off("typing");
        socket.off("stop typing");
      }
    };
  }, [socket, user]);

  useEffect(() => {
    const currentChat = selectedChatRef.current;
    if (currentChat && !currentChat.isGroupChat) {
      fetchMessages();
      const otherUser = getSenderUser();
      if (otherUser) {
        checkUserStatus(otherUser._id);
        const statusInterval = setInterval(() => {
          checkUserStatus(otherUser._id);
        }, 3000);

        return () => {
          clearInterval(statusInterval);
        };
      }
    }
  }, [selectedChat, user, fetchMessages, getSenderUser, checkUserStatus]);

  useEffect(() => {
    const currentChat = selectedChatRef.current;
    if (currentChat && !currentChat.isGroupChat && messages.length > 0) {
      markMessagesAsRead();
    }
  }, [messages, selectedChat, markMessagesAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, filteredMessages]);

  const sendMessage = async (event) => {
    const currentChat = selectedChatRef.current;
    if (!currentChat || currentChat.isGroupChat) {
      return;
    }

    if ((event.key === "Enter" || event.type === "click") && newMessage) {
      if (event.key === "Enter") {
        event.preventDefault();
      }

      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };

        setNewMessage("");

        const receiverUser = getSenderUser();
        if (!receiverUser || !receiverUser._id) {
          console.error("Receiver user or ID not found");
          return;
        }

        const messageData = {
          receiverId: receiverUser._id,
          message: newMessage,
          type: "text",
        };

        const { data } = await axios.post("/messages", messageData, config);

        const roomId = [user._id, receiverUser._id].sort().join("_");
        if (socket && socket.connected) {
          socket.emit("new message", { ...data, roomId });
        }

        setMessages((prevMessages) => [...prevMessages, data]);
      } catch (error) {
        console.error("Error sending message:", error);
        setNewMessage(newMessage); 
      }
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    const currentChat = selectedChatRef.current;
    if (!socket?.connected || !currentChat || currentChat.isGroupChat) {
      return;
    }

    const receiverUser = getSenderUser();
    if (!receiverUser || !receiverUser._id) {
      return;
    }

    const roomId = [user._id, receiverUser._id].sort().join("_");

    if (!typing && socket.connected) {
      setTyping(true);
      socket.emit("typing", { roomId, receiverId: receiverUser._id });
    }

    lastTypingTimeRef.current = new Date().getTime();
    const timerLength = 3000;

    setTimeout(() => {
      const timeNow = new Date().getTime();
      const timeDiff = timeNow - lastTypingTimeRef.current;
      if (timeDiff >= timerLength && typing && socket.connected) {
        socket.emit("stop typing", { roomId, receiverId: receiverUser._id });
        setTyping(false);
      }
    }, timerLength);
  };

  if (!selectedChat || selectedChat.isGroupChat) {
    return null;
  }
  const sender = getSenderUser();

  if (!sender) {
    return null;
  }

  return (
    <div className="single-chat-attractive-container">
      <div className="single-chat-header">
        {isMobileView && (
          <div className="back-button" onClick={toggleSideDrawer}>
            <i className="bi bi-arrow-left"></i>
          </div>
        )}
        <div className="sender-avatar">
          <img
            src={
              getSenderUser()?.profilePicture ||
              "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
            }
            alt={getSenderUser()?.username || "User"}
            className="sender-avatar-img"
          />
        </div>
        <div className="sender-details">
          <div className="sender-name">
            {getSenderUser()?.username || "Unknown"}
          </div>
          {/* Display Online or Last Seen */}
          <div className="sender-status">
            {isOtherUserOnline
              ? "Online"
              : otherUserLastSeen
              ? `Last seen ${formatLastSeen(otherUserLastSeen)}`
              : "Offline"}
          </div>
        </div>
        {/* Search Icon */}
        <div
          className="search-icon search-message-icon"
          onClick={() => setShowSearchInput(!showSearchInput)}
          title="Search messages"
        >
          <i className="bi bi-search single-chat-search-icon"></i>
        </div>
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
            isTyping={istyping}
            sender={getSenderUser()}
            handleSoftDelete={handleSoftDeleteMessage}
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
            onClick={() => {
              setShowSearchInput(false);
              setSearchQuery("");
            }}
          >
            &times;
          </button>
        </div>
      )}

      {!loading && (
        <div className="message-input-attractive-container">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="simple-message-form-row"
          >
            <input
              type="text"
              placeholder="Type Message.."
              onChange={typingHandler}
              onKeyDown={sendMessage}
              value={newMessage}
              className="simple-message-input"
            />
            <button
              type="button"
              className="input-icon-right"
              onClick={(e) =>
                sendMessage({ key: "Enter", preventDefault: () => {} })
              }
              disabled={!newMessage.trim()}
              aria-label="Send"
            >
              <i className="bi bi-send"></i>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SingleChat;
