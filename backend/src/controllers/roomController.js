import crypto from "crypto";
import Room from "../models/Room.js";
import {
  extractRoomMetaData,
  getRoomMeta,
  setRoomMeta,
  getRoomElements,
  removeRoomCache,
} from "../utils/redisUtils.js";

// Redis Convention for storing metadata of a room-> room:${roomId}:meta

const createRoom = async (req, res) => {
  if (!req.body.name) req.body.name = "Untitled Board";

  // Generate unique roomId and invite token
  const roomId = crypto.randomUUID();
  const inviteToken = crypto.randomBytes(8).toString("hex");

  const room = await Room.create({
    roomId,
    name: req.body.name,
    owner: req.user.id,
    inviteToken,
    members: [req.user.id],
    isPrivate: true,
    elements: [],
  });

  const meta = extractRoomMetaData(room);
  await setRoomMeta(roomId, meta);

  res.status(201).json({ message: "Room created successfully!", room });
};

const getRecentRooms = async (req, res) => {
  if (!req.user) return;

  // Do not select elements to prevent loading of MB of strokes for dashboard list
  const rooms = await Room.find({
    $or: [{ owner: req.user.id }, { members: req.user.id }],
  })
    .select(
      " roomId name owner inviteToken members isPrivate isLocked updatedAt createdAt",
    )
    .sort({ updatedAt: -1 })
    .populate("owner", "name email picture");

  return res.status(200).json({ success: true, rooms });
};

const getRoom = async (req, res) => {
  if (!req.params.roomId || !req.user.id) return;

  const room = await getRoomMeta(req.params.roomId);
  if (!room) {
    return res.status(404).json({ message: "No room found" });
  }

  const isLocked = room.isLocked;
  const isOwner = room.owner.toString() === req.user.id;
  const isMember = room.members.some(
    (member) => member.toString() === req.user.id,
  );
  const isValidToken = Boolean(
    req.query.token && room.inviteToken === req.query.token,
  );

  if (isLocked && !isOwner && !isMember) {
    return res.status(403).json({
      message: "This board is locked by the owner. New members cannot join.",
    });
  }

  // To access a room, user must be either an owner or a member or at least have valid invite token
  if (isOwner || isMember || isValidToken) {
    // If not a member, add to members array
    if (!isMember) {
      room.members.push(req.user.id);

      // Save to Redis and offload saving to MongoDB (remove await) -> No waiting, reduced latency
      await setRoomMeta(req.params.roomId, room);

      Room.updateOne(
        { roomId: req.params.roomId },
        { $addToSet: { members: req.user.id } },
      ).catch((err) => console.log("Background members update failed: ", err));
    }

    return res.status(200).json({
      message: "Joined room successfully!",
      room: { ...room, elements: await getRoomElements(req.params.roomId) },
    });
  }

  res
    .status(403)
    .json({ message: "Access Denied: Invalid token or unauthenticated" });
};

const deleteRoom = async (req, res) => {
  if (!req.params.roomId) {
    return res.status(400).json({ message: "roomId is required" });
  }

  const room = await getRoomMeta(req.params.roomId);
  if (!room) {
    return res.status(404).json({ message: "No room found" });
  }

  if (room.owner.toString() !== req.user.id) {
    return res.status(403).json({
      message: "Access Denied: Only board owner can delete this board",
    });
  }

  await Room.deleteOne({ roomId: req.params.roomId });

  // Remove elements, users and meta data of this room from Redis
  await removeRoomCache(req.params.roomId);

  // Broadcast room delete event to active users
  const io = req.app.get("io");
  if (io) {
    io.to(req.params.roomId).emit("room:delete", {
      message: "This board has been deleted by the owner",
    });
  }

  return res
    .status(200)
    .json({ success: true, message: "Room deletion has been successful!" });
};

const renameRoomName = async (req, res) => {
  const room = await getRoomMeta(req.params.roomId);
  if (!room) {
    return res.status(404).json({ message: "No room found" });
  }

  if (!req.body?.name.trim()) {
    return res.status(400).json({ message: "New room name must be specified" });
  }

  const isOwner = room.owner.toString() === req.user.id;
  if (isOwner) {
    room.name = req.body.name.trim();
    room.updatedAt = new Date().toISOString();

    await setRoomMeta(req.params.roomId, room);

    Room.updateOne(
      { roomId: req.params.roomId },
      { name: room.name, updatedAt: new Date() },
    ).catch((err) => console.error("Background room rename failed: ", err));

    return res.status(200).json({
      success: true,
      message: "Room name has been updated successfully!",
      roomName: room.name,
    });
  }

  return res.status(403).json({
    message: "Access Denied: Only board owner can rename this room",
  });
};

const toggleRoomLock = async (req, res) => {
  const room = await getRoomMeta(req.params.roomId);
  if (!room) {
    return res.status(404).json({ message: "No room found" });
  }

  const isOwner = room.owner.toString() === req.user.id;
  if (!isOwner) {
    return res.status(403).json({
      message: "Access Denied: Only board owner can lock or unlock this room",
    });
  }

  room.isLocked = !room.isLocked;
  await setRoomMeta(req.params.roomId, room);

  // Authoritative and security events emit from Backend (room:delete, room_lock:update)
  // High-frequency events emit from Frontend (cursor:move)

  // Broadcast room lock update event to active users
  const io = req.app.get("io");
  if (io) {
    io.to(req.params.roomId).emit("room_lock:update", {
      roomId: req.params.roomId,
      isLocked: room.isLocked,
      message: `This board has been ${room.isLocked ? "" : "un"}locked by the owner`,
    });
  }

  Room.updateOne(
    { roomId: req.params.roomId },
    { isLocked: room.isLocked, updatedAt: new Date() },
  ).catch((err) => console.error("Background room lock update failed: ", err));

  return res
    .status(200)
    .json({ message: "Room lock has been updated successfully!", room });
};

export {
  createRoom,
  getRecentRooms,
  getRoom,
  deleteRoom,
  renameRoomName,
  toggleRoomLock,
};
