import Room from "../models/Room.js";
import { client } from "../config/redis.js";
import {
  getRoomMeta,
  setRoomMeta,
  getRoomElements,
  setRoomElements,
  extractRoomMetaData,
} from "../utils/redisUtils.js";

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

// In-memory queue to prevent race conditions: roomId -> Map(Promise)
const roomQueues = new Map();

const queueRoomTask = (roomId, task) => {
  // If no previous task, start a new Promise()
  const previousTask = roomQueues.get(roomId) || Promise.resolve();

  // Do current task after previous task completed (Chain the tasks)
  const currentTask = previousTask
    .then(() => task())
    .catch((err) => console.error(`Error in room ${roomId} queue:`, err));

  // Store only last queued task which is either running or waiting to run
  roomQueues.set(roomId, currentTask);

  // If no more tasks, remove roomId
  currentTask.finally(() => {
    if (roomQueues.get(roomId) === currentTask) {
      roomQueues.delete(roomId);
    }
  });

  return currentTask;
};

// Redis Convention for storing elements-> room:${roomId}:elements
// Redis Convention for storing users-> room:${roomId}:users

// In-memory active users: roomId -> Map(socketId, user)
const getActiveUsers = async (roomId) => {
  const users = await client.hVals(`room:${roomId}:users`);
  return users.map((user) => JSON.parse(user));
};

// Join a room: Validates authorization against MongoDB and registers active user
const joinRoom = async ({ roomId, token, socketId, user }) => {
  let room = await getRoomMeta(roomId);

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

      // Store in Redis
      room = extractRoomMetaData(room);
      await setRoomMeta(roomId, room);
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

      // Save to Redis and offload saving to MongoDB (remove await) -> No waiting, reduced latency
      await setRoomMeta(roomId, room);

      Room.updateOne({ roomId }, { $addToSet: { members: user.id } }).catch(
        (err) => console.log("Background members update failed: ", err),
      );
    }
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
  if (user) user.color = assignedColor;

  // Add user to active users
  await client.hSet(
    `room:${roomId}:users`,
    socketId,
    JSON.stringify(user || {}),
  );
  await client.expire(`room:${roomId}:users`, 24 * 60 * 60);

  return {
    room,
    currentElements: await getRoomElements(roomId),
    activeUsers: await getActiveUsers(roomId),
  };
};

// Leave a room: Removes user from active users and returns remaining active users
const leaveRoom = async ({ roomId, socketId }) => {
  await client.hDel(`room:${roomId}:users`, socketId);

  return { activeUsers: await getActiveUsers(roomId) };
};

const renameRoomName = async ({ roomId, name, userId }) => {
  let room = await getRoomMeta(roomId);

  if (!room) return;
  if (userId && room.owner.toString() !== userId) return;

  room.name = name.trim();
  room.updatedAt = new Date().toISOString();

  await setRoomMeta(roomId, room);

  Room.updateOne({ roomId }, { name: room.name, updatedAt: new Date() }).catch(
    (err) => console.error("Background renameRoomName failed: ", err),
  );

  return { room };
};

// Persist committed stroke to MongoDB
const addElement = async ({ roomId, element }) => {
  return queueRoomTask(roomId, async () => {
    let elements = await getRoomElements(roomId);
    if (!elements) return;

    elements.push(element);
    await setRoomElements(roomId, elements);

    Room.updateOne(
      { roomId },
      {
        $push: { elements: element },
        $set: { updatedAt: new Date() },
      },
    ).catch((err) => console.error("Background addElement failed: ", err));

    return element;
  });
};

// Remove stroke from MongoDB
const removeElement = async ({ roomId, elementId }) => {
  return queueRoomTask(roomId, async () => {
    let elements = await getRoomElements(roomId);
    if (!elements) return;

    elements = elements.filter((element) => element.id !== elementId);
    await setRoomElements(roomId, elements);

    Room.updateOne(
      { roomId },
      {
        $pull: { elements: { id: elementId } },
        $set: { updatedAt: new Date() },
      },
    ).catch((err) => console.error("Background removeElement failed: ", err));
  });
};

// Update strokes in MongoDB
const updateElements = async ({ roomId, updatedElements }) => {
  return queueRoomTask(roomId, async () => {
    if (!updatedElements || updatedElements.length === 0) return;

    let elements = await getRoomElements(roomId);
    if (!elements) return;

    elements = elements.map((element) => {
      const updated = updatedElements.find((el) => el.id === element.id);
      return updated || element;
    });

    await setRoomElements(roomId, elements);

    Room.updateOne(
      { roomId },
      {
        $set: { elements, updatedAt: new Date() },
      },
    ).catch((err) => console.error("Background updateElements failed: ", err));
  });
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
