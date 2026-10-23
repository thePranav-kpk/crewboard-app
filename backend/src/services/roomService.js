// Store all rooms
const rooms = new Map();

const createRoom = ({ roomId, name, isPrivate, key, ownerId }) => {
  if (rooms.has(roomId)) {
    throw new Error("Room already exists");
  }

  // Create Room object
  const room = {
    id: roomId,
    name: name,
    isPrivate: isPrivate,
    key: key || null,
    ownerId: ownerId,
    users: new Map(),
    elements: [],
    createdAt: Date.now(),
  };
  rooms.set(roomId, room);

  return room;
};

const joinRoom = ({ roomId, key, socketId, user }) => {
  let room = rooms.get(roomId);

  // Auto-create room if it doesn't exist yet (e.g. default public room)
  if (!room) {
    room = createRoom({
      roomId: roomId,
      name: roomId,
      isPrivate: false,
      key: null,
      ownerId: user?.id || "system",
    });
  }
  // Key is required for private rooms
  if (room.isPrivate) {
    if (room.key != key) {
      throw new Error("Invalid room key");
    }
  }
  room.users.set(socketId, user);

  return {
    room,
    currentElements: room.elements,
    activeUsers: Array.from(room.users.values()),
  };
};

const leaveRoom = ({ roomId, socketId }) => {
  if (!rooms.has(roomId)) {
    throw new Error("No room exists");
  }

  const room = rooms.get(roomId);
  room.users.delete(socketId);

  return { activeUsers: Array.from(room.users.values()) };
};

const addElement = ({ roomId, element }) => {
  if (!rooms.has(roomId)) {
    throw new Error("No room exists");
  }

  const room = rooms.get(roomId);
  room.elements.push(element);

  return element;
};

const getRoom = (roomId) => {
  if (!rooms.has(roomId)) {
    throw new Error("No room exists");
  }

  const room = rooms.get(roomId);

  return room;
};

const removeElement = ({ roomId, elementId }) => {
  const room = rooms.get(roomId);
  if (!room) return;

  room.elements = room.elements.filter((el) => el.id !== elementId);
};

const updateElements = ({ roomId, updatedElements }) => {
  const room = rooms.get(roomId);
  if (!room || !updatedElements || updatedElements.length === 0) return;

  // Replace only the updated elements
  room.elements = room.elements.map((element) => {
    const newElement = updatedElements.find((el) => el.id === element.id);
    return newElement ? newElement : element;
  });
};

export {
  createRoom,
  joinRoom,
  leaveRoom,
  addElement,
  getRoom,
  removeElement,
  updateElements,
};
