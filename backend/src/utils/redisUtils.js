import Room from "../models/Room.js";
import { client } from "../config/redis.js";

const ROOM_TTL = 24 * 60 * 60; // 24 hours

// Helper to extract room meta data from Mongoose document excluding elements
const extractRoomMetaData = (room) => {
  return {
    roomId: room.roomId,
    name: room.name,
    isPrivate: room.isPrivate,
    owner: room.owner?.toString(),
    inviteToken: room.inviteToken,
    members: (room.members || []).map((m) => m.toString()),
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  };
};

// Helper to get meta data from Redis
const getRoomMeta = async (roomId) => {
  // Check in Redis
  try {
    const cached = await client.get(`room:${roomId}:meta`);

    // Cache hit
    if (cached) return JSON.parse(cached);
  } catch (err) {
    console.error("Redis getRoomMeta read error: ", err);
  }

  // Cache miss
  const room = await Room.findOne({ roomId: roomId }).select("-elements");
  if (!room) return null;

  // Store in Redis
  const meta = extractRoomMetaData(room);
  try {
    await setRoomMeta(roomId, meta);
  } catch (err) {
    console.error("Redis getRoomMeta write error: ", err);
  }

  return meta;
};

// Helper to store meta data in Redis
const setRoomMeta = async (roomId, meta) => {
  try {
    await client.set(`room:${roomId}:meta`, JSON.stringify(meta), {
      EX: ROOM_TTL,
    });
  } catch (err) {
    console.error("Redis setRoomMeta error: ", err);
  }
};

// Helper to get elements of a room
const getRoomElements = async (roomId) => {
  try {
    const cached = await client.get(`room:${roomId}:elements`);

    // Cache Hit
    if (cached) return JSON.parse(cached);
  } catch (err) {
    console.error("Redis getRoomElements read error: ", err);
  }

  // Cache miss
  const room = await Room.findOne({ roomId }).select("elements");
  if (!room) return [];

  // Store in Redis
  const elements = room?.elements || [];
  try {
    await client.set(`room:${roomId}:elements`, JSON.stringify(elements), {
      EX: ROOM_TTL,
    });
  } catch (err) {
    console.error("Redis getRoomElements seed error:", err);
  }
  return elements;
};

const setRoomElements = async (roomId, elements) => {
  try {
    await client.set(`room:${roomId}:elements`, JSON.stringify(elements), {
      EX: ROOM_TTL,
    });
  } catch (err) {
    console.error("Redis setRoomElements write error: ", err);
  }
};

// Helper to remove room cache after room deletion
const removeRoomCache = async (roomId) => {
  try {
    await client.del([
      `room:${roomId}:elements`,
      `room:${roomId}:users`,
      `room:${roomId}:meta`,
    ]);
  } catch (err) {
    console.error("Redis purgeRoomCache error: ", err);
  }
};

export {
  extractRoomMetaData,
  getRoomMeta,
  setRoomMeta,
  getRoomElements,
  setRoomElements,
  removeRoomCache,
};
