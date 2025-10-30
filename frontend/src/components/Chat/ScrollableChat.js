import animationData from "../../animation/typing.json";
import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { ChatState } from "../../context/ChatProvider";
import Lottie from "react-lottie";

const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
};

const ScrollableChat = ({
  messages = [],
  isGroupChat = false,
  isTyping = false,
  handleSoftDelete,
}) => {
  const { user } = ChatState();
  const messagesEndRef = useRef(null);
  const prevMessagesRef = useRef(messages);


  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const isSender = useCallback(
    (senderId) => {
      if (!senderId || !user) return false;
      return senderId._id === user._id;
    },
    [user]
  );

  const getStatusIcon = useCallback(
    (message) => {
      if (!message || !isSender(message.senderId)) return null;


      if (isGroupChat) {
        const isDelivered = message.deliveredTo?.some(
          (userId) => userId === user._id
        );
        const isRead = message.readBy?.some((userId) => userId === user._id);

        if (isRead) {
          return (
            <span className="status-icon status-read" title="Read">
              ✓✓
            </span>
          );
        } else if (isDelivered) {
          return (
            <span className="status-icon status-delivered" title="Delivered">
              ✓✓
            </span>
          );
        } else {
          return (
            <span className="status-icon status-sent" title="Sent">
              ✓
            </span>
          );
        }
      } else {
     
        switch (message.status) {
          case "sent":
            return (
              <span className="status-icon status-sent" title="Sent">
                ✓
              </span>
            );
          case "delivered":
            return (
              <span className="status-icon status-delivered" title="Delivered">
                ✓✓
              </span>
            );
          case "read":
            return (
              <span className="status-icon status-read" title="Read">
                ✓✓
              </span>
            );
          default:
            return (
              <span className="status-icon status-sent" title="Sent">
                ✓
              </span>
            );
        }
      }
    },
    [isSender, isGroupChat, user]
  );


  useEffect(() => {
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const prevLastMessage =
        prevMessagesRef.current[prevMessagesRef.current.length - 1];


      if (
        lastMessage &&
        lastMessage.status &&
        (!prevLastMessage || prevLastMessage.status !== lastMessage.status)
      ) {
        console.log("Message status changed:", lastMessage.status);
      }

      prevMessagesRef.current = messages;
    }
  }, [messages]);

  if (!messages || !Array.isArray(messages)) {
    return <div className="messages-list">No messages</div>;
  }

  return (
    <div className="messages-list">
      {messages.map((message, i) => {
        if (!message) return null;

        const received = !isSender(message.senderId);

        const uniqueKey = `${message._id}-${i}`;

        return (
          <div
            key={uniqueKey}
            className={`message-item ${received ? "received" : "sent"}`}
          >

            {isGroupChat && received && message.senderId && (
              <div className="group-message-sender-info">
                <img
                  src={
                    message.senderId.profilePicture ||
                    "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
                  }
                  alt={message.senderId.username || "User"}
                  className="group-message-avatar"
                />
              </div>
            )}
            <div className="message-content">
              <div className="message-text">
                <p className="m-0">{message.message}</p>
              </div>
              <div className="message-meta">
                <span className="message-time">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {getStatusIcon(message)}
                {message.senderId._id === user._id && !isGroupChat && (
                  <i
                    className="bi bi-trash delete-icon"
                    onClick={() => handleSoftDelete(message._id)}
                    title="Delete for me"
                  ></i>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {isTyping && !isGroupChat && (
        <div className="message-item received">
          <div className="typing-indicator">
            <Lottie options={defaultOptions} width={70} height={50} />
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ScrollableChat;
