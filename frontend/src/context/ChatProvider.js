import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";

const ChatContext = createContext();

const ChatProvider = ({ children }) => {
  const [user, setUser] = useState();
  const [selectedChat, setSelectedChat] = useState();
  const [notification, setNotification] = useState([]);
  const [socket, setSocket] = useState(null);
  const [fetchingNotifications, setFetchingNotifications] = useState(false);
  const history = useHistory();
  const [fetchAgain, setFetchAgain] = useState(false);

  const selectedChatRef = useRef();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (userInfo) {
      setUser(userInfo);
      fetchCurrentUser(userInfo._id, userInfo.token);
    } else {
      history.push("/");
    }
  }, [history]);


  const fetchCurrentUser = async (userId, token) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const { data } = await axios.get(`/users/${userId}`, config);
      const updatedUserInfo = { ...data, token };
      localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));
      setUser(updatedUserInfo);
    } catch (error) {
      console.error("Failed to fetch current user data:", error);
    }
  };

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);


  const fetchNotifications = useCallback(async () => {
    if (!user || !user.token || fetchingNotifications) {
      console.log("fetchNotifications skipped:", {
        user: !!user,
        token: !!user?.token,
        fetchingNotifications,
      });
      return;
    }

    try {
      setFetchingNotifications(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const backendUrl =
        process.env.REACT_APP_API_URL || "http://localhost:5000";
      const { data } = await axios.get(`${backendUrl}/notifications`, config);

      
      const isInitialFetch =
        notification.length === 0 && !fetchingNotifications;

      if (data.length > 0) {
        if (isInitialFetch) {
          const shouldUpdateInitial =
            notification.length !== data.length ||
            (data.length > 0 &&
              notification.some((n, i) => n?._id !== data[i]?._id));

          if (shouldUpdateInitial) {
            setNotification(data);
          } else {
            console.log(
              "fetchNotifications: Initial data is the same, no update."
            );
          }
        } else {
   
          const existingIds = new Set(notification.map((n) => n._id));
          const newNotifications = data.filter(
            (notif) => !existingIds.has(notif._id)
          );

          if (newNotifications.length > 0) {
            console.log(
              "fetchNotifications: Adding new notifications:",
              newNotifications
            );
            setNotification((prev) => [...newNotifications, ...prev]);
          } else {
            console.log(
              "fetchNotifications: No new notifications to add on subsequent fetch."
            );
          }
        }
      } else if (notification.length > 0) {
        setNotification([]);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setFetchingNotifications(false);
    }
  }, [user?.token, user?._id]); 

  
  const markNotificationsAsRead = useCallback(
    async (notificationsToMark) => {
      if (!user || !user.token || !notificationsToMark.length) return;

      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        const messageIds = notificationsToMark.map((n) => n._id);
        const backendUrl =
          process.env.REACT_APP_API_URL || "http://localhost:5000";
        await axios.put(
          `${backendUrl}/notifications/read`,
          { messageIds },
          config
        );

      
        if (socket) {
          notificationsToMark.forEach((notif) => {
            socket.emit("message read", {
              messageId: notif._id,
              senderId: notif.senderId?._id || notif.sender?._id,
            });
          });
        }

        
        setNotification((prev) =>
          prev.filter((n) => !messageIds.includes(n._id))
        );
      } catch (error) {
        console.error("Error marking notifications as read:", error);
      }
    },
    [user, socket]
  );

 
  const handleNewNotification = useCallback(
    (notification) => {
      console.log("handleNewNotification received:", notification);

      if (!notification) {
        console.error("Invalid notification data received:", notification);
        return;
      }

      const notificationSenderId = notification.isGroupChat
        ? notification.senderId?._id
        : notification.sender?._id || notification.senderId?._id;

      if (!notificationSenderId) {
        console.error(
          "Invalid notification data (missing sender ID):",
          notification
        );
        return;
      }

      if (notificationSenderId === user?._id) {
        console.log("Notification is from current user, skipping.");
        return;
      }

      if (selectedChatRef.current) {
        if (notification.isGroupChat) {
          if (notification.chatId === selectedChatRef.current._id) {
            return;
          }
        } else {
          const otherUserId = selectedChatRef.current.users?.find(
            (u) => u._id !== user?._id
          )?._id;

          if (otherUserId && notificationSenderId === otherUserId) {
            return;
          }
        }
      }

      const transformedNotification = {
        ...notification,
        senderId: notification.isGroupChat
          ? notification.senderId
          : notification.sender || notification.senderId,
      };

      setNotification((prev) => {
        if (prev.some((n) => n._id === notification._id)) {
          return prev;
        }
        return [transformedNotification, ...prev];
      });
    },
    [user?._id]
  );

 
  useEffect(() => {
    if (!user) return;

    let socketInstance = null;
    let reconnectTimeout = null;

    const setupSocket = async () => {
      try {
        const { default: io } = await import("socket.io-client");
        const ENDPOINT =
          process.env.REACT_APP_API_URL || "http://localhost:5000";

        console.log("Attempting to connect to:", ENDPOINT);

      
        if (socketInstance) {
          socketInstance.disconnect();
        }

       
        socketInstance = io(ENDPOINT, {
          transports: ["websocket", "polling"],
          path: "/socket.io",
          withCredentials: true,
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
          reconnectionDelayMax: 10000,
          randomizationFactor: 0.5,
          autoConnect: true,
          forceNew: true,
          extraHeaders: {
            "Access-Control-Allow-Origin":
              process.env.REACT_APP_API_URL || "http://localhost:5000",
          },
        });

       
        socketInstance.on("connect", () => {
          console.log("Socket connected successfully to:", ENDPOINT);
          console.log("Socket ID:", socketInstance.id);
          setSocket(socketInstance);

          if (user) {
            socketInstance.emit("setup", user);

            setTimeout(() => {
              fetchNotifications();
            }, 1000);
          }
        });

        socketInstance.on("connect_error", (error) => {
          console.error("Socket connection error:", error.message);
          console.log("Error details:", error);

        
          if (reconnectTimeout) clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(() => {
            console.log("Attempting manual reconnection...");
            if (socketInstance && !socketInstance.connected) {
              socketInstance.connect();
            }
          }, 3000);
        });

        socketInstance.on("disconnect", (reason) => {
          console.log("Socket disconnected:", reason);
          setSocket(null);
        });

        socketInstance.on("error", (error) => {
          console.error("Socket error:", error);
        });

        socketInstance.on("reconnect", (attemptNumber) => {
          console.log("Socket reconnected after", attemptNumber, "attempts");
        });

        socketInstance.on("reconnect_error", (error) => {
          console.error("Socket reconnection error:", error);
        });

      
        socketInstance.on("new notification", (notification) => {
          console.log("New notification received via socket:", notification);
          handleNewNotification(notification);
        });

    
        socketInstance.on("message read", ({ messageId }) => {
          setNotification((prev) =>
            prev.filter((notif) => notif._id !== messageId)
          );
        });
      } catch (error) {
        console.error("Error setting up socket:", error);
      
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(() => {
          console.log("Retrying socket setup...");
          setupSocket();
        }, 5000);
      }
    };


    setupSocket();


    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socketInstance) {
        console.log("Cleaning up socket connection");
        socketInstance.off("connect");
        socketInstance.off("connect_error");
        socketInstance.off("disconnect");
        socketInstance.off("error");
        socketInstance.off("reconnect");
        socketInstance.off("reconnect_error");
        socketInstance.off("new notification");
        socketInstance.off("message read");
        socketInstance.disconnect();
      }
    };
  }, [user?._id]); 

 
  useEffect(() => {
    if (user?.token) {
      const timeoutId = setTimeout(() => {
        fetchNotifications();
      }, 2000); 

      return () => clearTimeout(timeoutId);
    }
  }, [user?.token]);


  useEffect(() => {
    if (!selectedChat || notification.length === 0) {
      return;
    }

    console.log("Attempting to clear notifications for selected chat.");

    try {
      let notificationsToKeep = [];
      let notificationsToMarkRead = [];

      if (selectedChat.isGroupChat) {
        notificationsToKeep = notification.filter((notif) => {
          const isNotificationForSelectedGroup =
            notif.isGroupChat && notif.chatId === selectedChat._id;

          if (isNotificationForSelectedGroup) {
            notificationsToMarkRead.push(notif);
            return false;
          }
          return true;
        });
      } else {
        const otherUserId = selectedChat.users?.find(
          (u) => u._id !== user?._id
        )?._id;

        if (otherUserId) {
          notificationsToKeep = notification.filter((notif) => {
            const isNotificationFromSelectedUser =
              !notif.isGroupChat &&
              (notif.senderId?._id || notif.sender?._id) === otherUserId;

            if (isNotificationFromSelectedUser) {
              notificationsToMarkRead.push(notif);
              return false;
            }
            return true;
          });
        } else {
          notificationsToKeep = notification;
        }
      }

      const hasNotificationStateChanged =
        notification.length !== notificationsToKeep.length ||
        notification.some((n, i) => n?._id !== notificationsToKeep[i]?._id);

      if (hasNotificationStateChanged) {
        console.log(
          "Updating notification state after filtering. New state:",
          notificationsToKeep
        );
        setNotification(notificationsToKeep);
      }

      if (notificationsToMarkRead.length > 0) {
        console.log(
          "Marking notifications as read on backend:",
          notificationsToMarkRead
        );
        markNotificationsAsRead(notificationsToMarkRead).catch((error) =>
          console.error(
            "Error marking notifications as read on backend:",
            error
          )
        );
      }
    } catch (error) {
      console.error("Error clearing notifications locally:", error);
    }
  }, [selectedChat?._id, notification.length, user?._id]); 

  return (
    <ChatContext.Provider
      value={{
        user,
        setUser,
        selectedChat,
        setSelectedChat,
        notification,
        setNotification,
        fetchCurrentUser,
        fetchNotifications,
        markNotificationsAsRead,
        fetchAgain,
        setFetchAgain,
        socket, 
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const ChatState = () => useContext(ChatContext);

export default ChatProvider;
