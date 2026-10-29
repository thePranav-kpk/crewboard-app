import {
  joinRoom,
  leaveRoom,
  addElement,
  removeElement,
  updateElements,
} from "../services/roomService.js";

// Emit board events to everyone in the room except the sender
const registerBoardHandlers = (io, socket) => {
  // Event for joining room
  socket.on("room:join", async ({ roomId, token, key }, callback) => {
    try {
      const { currentElements, activeUsers } = await joinRoom({
        roomId,
        token: token || key,
        socketId: socket.id,
        user: socket.user,
      });

      socket.join(roomId);
      socket.currentRoom = roomId;

      socket.to(roomId).emit("user:joined", { user: socket.user });

      if (typeof callback === "function") {
        callback({ success: true, currentElements, activeUsers });
      } else {
        socket.emit("room:joined", { currentElements, activeUsers });
      }
    } catch (err) {
      if (typeof callback === "function") {
        callback({ success: false, error: err.message });
      } else {
        socket.emit("room:error", { message: err.message });
      }
    }
  });

  // Event for drawing stream
  socket.on("draw:stream", (data) => {
    if (socket.currentRoom) {
      socket.to(socket.currentRoom).emit("draw:stream", data);
    }
  });

  // Event for saving drawing
  socket.on("draw:commit", ({ element }) => {
    if (socket.currentRoom) {
      addElement({ roomId: socket.currentRoom, element });
      socket.to(socket.currentRoom).emit("draw:commit", { element });
    }
  });

  // Event to sync cursor movement
  socket.on("cursor:move", ({ x, y }) => {
    if (socket.currentRoom) {
      socket.to(socket.currentRoom).emit("cursor:move", {
        userId: socket.user.id,
        name: socket.user.name,
        color: socket.user.color,
        x,
        y,
      });
    }
  });

  // Event for diconnecting
  socket.on("disconnecting", () => {
    if (socket.currentRoom) {
      leaveRoom({ roomId: socket.currentRoom, socketId: socket.id });
      socket
        .to(socket.currentRoom)
        .emit("user:left", { userId: socket.user.id });
    }
  });

  // Event for deleting
  socket.on("draw:delete", ({ elementId }) => {
    if (socket.currentRoom) {
      removeElement({ roomId: socket.currentRoom, elementId });
      socket.to(socket.currentRoom).emit("draw:delete", { elementId });
    }
  });

  // Event for updating elements
  socket.on("draw:update", ({ updatedElements }) => {
    if (socket.currentRoom) {
      updateElements({ roomId: socket.currentRoom, updatedElements });
      socket.to(socket.currentRoom).emit("draw:update", { updatedElements });
    }
  });
};

export { registerBoardHandlers };
