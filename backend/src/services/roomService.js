import Room from "../models/Room.js";

// In-memory active users: roomId -> Map(socketId, user)
const activeUsersByRoom = new Map();

const getActiveUsers = (roomId) => {
  const usersMap = activeUsersByRoom.get(roomId);
  return usersMap ? Array.from(usersMap.values()) : [];
};

// Join a room: Validates authorization against MongoDB and registers active user
const joinRoom = async ({ roomId, token, socketId, user }) => {
  let room = await Room.findOne({ roomId });

  // Auto-create default public general room if it does not exist yet
  if (!room) {
    if (roomId === "general") {
      room = await Room.create({
        roomId: "general",
        name: "General Board",
        owner: user?.id,
        members: user?.id ? [user.id] : [],
        isPrivate: false,
        elements: [],
      });
    } else {
      throw new Error("Room not found");
    }
  }

  // Authorization check for private rooms
  if (room.isPrivate) {
    const isOwner = room.owner.toString() === user?.id;
    const isMember = room.members.some((m) => m.toString() === user?.id);
    const isValidToken = Boolean(token && room.inviteToken === token);

    if (!isOwner && !isMember && !isValidToken) {
      throw new Error("Access Denied: Invalid invite link or unauthorized");
    }

    // If not a member, add to members in MongoDB
    if (!isMember && user?.id) {
      room.members.push(user.id);
      await room.save();
    }
  }

  // In-memory active user
  if (!activeUsersByRoom.has(roomId)) {
    // If no room, create a room
    activeUsersByRoom.set(roomId, new Map());
  }
  // Add user to active users
  activeUsersByRoom.get(roomId).set(socketId, user);

  return {
    room,
    currentElements: room.elements || [],
    activeUsers: getActiveUsers(roomId),
  };
};

// Leave a room: Removes user from active users and returns remaining active users
const leaveRoom = ({ roomId, socketId }) => {
  if (activeUsersByRoom.has(roomId)) {
    // Remove the user
    activeUsersByRoom.get(roomId).delete(socketId);
    if (activeUsersByRoom.get(roomId).size === 0) {
      // If no more active users, remove the room from in-memory
      activeUsersByRoom.delete(roomId);
    }
  }

  return { activeUsers: getActiveUsers(roomId) };
};

const renameRoomName = async ({ roomId, name, userId }) => {
  let room = await Room.findOne({ roomId });
  if (!room) return;

  if (userId && room.owner.toString() !== userId) return;

  room.name = name.trim();
  await room.save();

  return { room };
};

// Persist committed stroke to MongoDB
const addElement = async ({ roomId, element }) => {
  await Room.updateOne(
    { roomId },
    {
      $push: { elements: element },
      $set: { updatedAt: new Date() },
    },
  );
  return element;
};

// Remove stroke from MongoDB
const removeElement = async ({ roomId, elementId }) => {
  await Room.updateOne(
    { roomId },
    {
      $pull: { elements: { id: elementId } },
      $set: { updatedAt: new Date() },
    },
  );
};

// Update strokes in MongoDB
const updateElements = async ({ roomId, updatedElements }) => {
  if (!updatedElements || updatedElements.length === 0) return;

  const room = await Room.findOne({ roomId });
  if (!room) return;

  const newElements = room.elements.map((element) => {
    const updated = updatedElements.find((el) => el.id === element.id);
    return updated || element;
  });

  room.elements = newElements;
  room.updatedAt = new Date();
  await room.save();
};

export {
  joinRoom,
  leaveRoom,
  addElement,
  removeElement,
  updateElements,
  getActiveUsers,
  renameRoomName,
};
