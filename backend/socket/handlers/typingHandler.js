const handleTyping = (socket, data) => {
  const { roomId, receiverId } = data;

  if (!roomId || !receiverId) {
    return;
  }

  socket.to(receiverId).emit("typing", {
    senderId: socket.userId,
    roomId,
  });
};

const handleStopTyping = (socket, data) => {
  const { roomId, receiverId } = data;

  if (!roomId || !receiverId) {
    return;
  }

  socket.to(receiverId).emit("stop typing", {
    senderId: socket.userId,
    roomId,
  });
};

const handleGroupTyping = (socket, data) => {
  const { groupId } = data;

  if (!groupId) {
    return;
  }

  socket.to(groupId).emit("typing", {
    senderId: socket.userId,
    groupId,
  });
};

const handleGroupStopTyping = (socket, data) => {
  const { groupId } = data;

  if (!groupId) {
    return;
  }

  socket.to(groupId).emit("stop typing", {
    senderId: socket.userId,
    groupId,
  });
};

module.exports = {
  handleTyping,
  handleStopTyping,
  handleGroupTyping,
  handleGroupStopTyping,
};
