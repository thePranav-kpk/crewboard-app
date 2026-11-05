import Room from "../models/Room.js";
import { client } from "../config/redis.js";

const CURSOR_COLORS = [
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#14b8a6", // Teal
  "#84cc16", // Lime
];

// Redis Convention for storing elements-> room:${roomId}:elements
// Redis Convention for storing users-> room:${roomId}:users

// In-memory active users: roomId -> Map(socketId, user)
const getActiveUsers = async (roomId) => {
  const users = await client.hVals(`room:${roomId}:users`);
  return users.map((user) => JSON.parse(user));
};

// Join a room: Validates authorization against MongoDB and registers active user
const joinRoom = async ({ roomId, token, socketId, user }) => {
  let room = await Room.findOne({ roomId }).select("-elements");

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

  let currentElements;
  const cachedElements = await client.get(`room:${roomId}:elements`);

  // Cache Hit
  if (cachedElements) {
    currentElements = JSON.parse(cachedElements);
  }
  // Cache miss
  else {
    // Store in Redis
    const roomData = await Room.findOne({ roomId }).select("elements");
    currentElements = roomData?.elements || [];

    await client.set(
      `room:${roomId}:elements`,
      JSON.stringify(currentElements),
      {
        EX: 24 * 60 * 60, // Expires in 24 hrs
      },
    );
  }

  if (user?.id) {
    const existingSockets = await client.hGetAll(`room:${roomId}:users`);
    for (const [sId, uJson] of Object.entries(existingSockets)) {
      try {
        const u = JSON.parse(uJson);
        if (u.id === user.id || u._id === user.id) {
          await client.hDel(`room:${roomId}:users`, sId);
        }
      } catch (_) {}
    }
  }

  // Check colors currently taken by active peers in this room
  const currentActiveUsers = await getActiveUsers(roomId);
  const takenColors = currentActiveUsers.map((u) => u.color).filter(Boolean);

  // Pick the first color not taken
  const assignedColor =
    CURSOR_COLORS.find((c) => !takenColors.includes(c)) ||
    CURSOR_COLORS[currentActiveUsers.length % CURSOR_COLORS.length];

  // Assign to user
  if (user) {
    user.color = assignedColor;
  }

  // Add user to active users
  await client.hSet(
    `room:${roomId}:users`,
    socketId,
    JSON.stringify(user || {}),
  );
  await client.expire(`room:${roomId}:users`, 24 * 60 * 60);

  return {
    room,
    currentElements,
    activeUsers: await getActiveUsers(roomId),
  };
};

// Leave a room: Removes user from active users and returns remaining active users
const leaveRoom = async ({ roomId, socketId }) => {
  await client.hDel(`room:${roomId}:users`, socketId);

  return { activeUsers: await getActiveUsers(roomId) };
};

const renameRoomName = async ({ roomId, name, userId }) => {
  let room = await Room.findOne({ roomId }).select("owner name");
  if (!room) return;

  if (userId && room.owner.toString() !== userId) return;

  room.name = name.trim();
  await room.save();

  return { room };
};

// Persist committed stroke to MongoDB
const addElement = async ({ roomId, element }) => {
  // Store in Redis
  const cachedElements = await client.get(`room:${roomId}:elements`);
  if (cachedElements) {
    let elements = JSON.parse(cachedElements);
    elements.push(element);

    await client.set(`room:${roomId}:elements`, JSON.stringify(elements), {
      EX: 24 * 60 * 60,
    });
  }

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
  const cachedElements = await client.get(`room:${roomId}:elements`);
  if (cachedElements) {
    let elements = JSON.parse(cachedElements);
    elements = elements.filter((element) => element.id !== elementId);

    await client.set(`room:${roomId}:elements`, JSON.stringify(elements), {
      EX: 24 * 60 * 60,
    });
  }

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

  const cachedElements = await client.get(`room:${roomId}:elements`);
  if (cachedElements) {
    let elements = JSON.parse(cachedElements);
    elements = elements.map((element) => {
      const updated = updatedElements.find((el) => el.id === element.id);
      return updated || element;
    });

    await client.set(`room:${roomId}:elements`, JSON.stringify(elements), {
      EX: 24 * 60 * 60,
    });
  }

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
