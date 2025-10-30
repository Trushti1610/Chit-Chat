const { handleUserSetup, handleDisconnect } = require("./handlers/baseHandler");

const {
  handleNewMessage,
  handleMessageDelivery,
  handleMessageRead,
  handleClearNotifications,
} = require("./handlers/messageHandler");

const {
  handleNewGroupMessage,
  handleGroupUserAdded,
  handleGroupUserRemoved,
  handleGroupSettingsUpdated,
  handleJoinGroup,
  handleLeaveGroup,
  handleGroupMessageStatus,
} = require("./handlers/groupHandler");

const {
  handleTyping,
  handleStopTyping,
  handleGroupTyping,
  handleGroupStopTyping,
} = require("./handlers/typingHandler");

const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    // console.log("Connected to socket.io", socket.id);


    socket.on("setup", (userData) => handleUserSetup(socket, userData, io));


    socket.on("join chat", (room) => {
      socket.join(room);
      // console.log("User joined room: " + room);
    });

   
    socket.on("join group", (groupId) => handleJoinGroup(socket, groupId));
    socket.on("leave group", (groupId) => handleLeaveGroup(socket, groupId));

  
    socket.on("typing", (data) => handleTyping(socket, data));
    socket.on("stop typing", (data) => handleStopTyping(socket, data));
    socket.on("typing in group", (data) => handleGroupTyping(socket, data));
    socket.on("stop typing in group", (data) =>
      handleGroupStopTyping(socket, data)
    );


    socket.on("new message", (messageData) =>
      handleNewMessage(socket, messageData, io)
    );
    socket.on("message delivered", (data) =>
      handleMessageDelivery(socket, data, io)
    );
    socket.on("message read", (data) => handleMessageRead(socket, data, io));
    socket.on("clear notifications", (data) =>
      handleClearNotifications(socket, data, io)
    );


    socket.on("new group message", (messageData) =>
      handleNewGroupMessage(socket, messageData, io)
    );
    socket.on("group message status", (data) =>
      handleGroupMessageStatus(socket, data, io)
    );


    socket.on("group user added", (data) =>
      handleGroupUserAdded(socket, data, io)
    );
    socket.on("group user removed", (data) =>
      handleGroupUserRemoved(socket, data, io)
    );
    socket.on("group settings updated", (groupData) =>
      handleGroupSettingsUpdated(socket, groupData, io)
    );

 
    socket.on("disconnect", () => handleDisconnect(socket, io));
  });
};

module.exports = { initializeSocket };
