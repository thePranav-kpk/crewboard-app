import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const useSocket = ({
  roomId,
  token,
  onStrokeReceived,
  onInitialElements,
  onStrokeDeleted,
  onElementsUpdated,
  onReactionReceived,
}) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [peers, setPeers] = useState([]);
  const [peerCursors, setPeerCursors] = useState({});
  const [roomName, setRoomName] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [roomError, setRoomError] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [inviteToken, setInviteToken] = useState(token || "");

  // On entering a room
  useEffect(() => {
    // Connect to client-socket
    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      withCredentials: true,
      transports: ["websocket"],
    });
    socketRef.current = socket;

    // Event on connect
    socket.on("connect", () => {
      setIsConnected(true);

      // Event to join a room
      socket.emit("room:join", { roomId, token }, (res) => {
        if (res.success) {
          if (res.roomName) setRoomName(res.roomName);
          onInitialElements(res.currentElements);
          setPeers(res.activeUsers);
          setIsOwner(res.isOwner);
          setOwnerId(res.ownerId);
          setIsLocked(res.isLocked);
          if (res.inviteToken) setInviteToken(res.inviteToken);
        } else {
          setRoomError(res?.error || "Room not found or access denied");
        }
      });
    });

    // Event on joining a deleted room or non-existant room or any other error
    socket.on("room:error", ({ message }) => {
      setRoomError(message || "Room error");
    });

    socket.on("draw:commit", ({ element }) => {
      // Capture the stroke and pass it down
      onStrokeReceived(element);
    });

    socket.on("user:joined", ({ user }) => {
      // Add user to active users list
      setPeers((prev) => {
        const newUserId = user.id || user._id;
        const filteredUsers = prev.filter((u) => (u.id || u._id) !== newUserId);
        return [...filteredUsers, user];
      });
    });

    socket.on("user:left", ({ userId }) => {
      // Remove the user from active users list
      setPeers((prev) =>
        prev.filter((peer) => {
          if ((peer.id || peer._id) !== userId) return peer;
        }),
      );

      // Remove the user mouse coordinates
      setPeerCursors((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    socket.on("cursor:move", ({ userId, name, color, x, y }) => {
      // Update the mouse coordinates
      setPeerCursors((prev) => ({
        ...prev,
        [userId]: { name, color, x, y },
      }));
    });

    // Event on disconnect
    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    // Event on delete
    socket.on("draw:delete", ({ elementId }) => {
      onStrokeDeleted(elementId);
    });

    // Event on elements position update
    socket.on("draw:update", ({ updatedElements }) => {
      onElementsUpdated(updatedElements);
    });

    // Event on room rename
    socket.on("room:rename", ({ name }) => {
      setRoomName(name);
    });

    // Event on room deletion
    socket.on("room:delete", ({ message }) => {
      setRoomError(message);
    });

    // Event on room lock update
    socket.on("room_lock:update", ({ isLocked }) => {
      setIsLocked(isLocked);
    });

    // Event on reactions
    socket.on("reaction:send", (data) => {
      onReactionReceived(data);
    });

    return () => {
      socket.off("room:rename");
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const emitStroke = (element) => {
    socketRef.current?.emit("draw:commit", { element });
  };

  const emitCursor = (x, y) => {
    socketRef.current?.emit("cursor:move", { x, y });
  };

  const emitDelete = (elementId) => {
    socketRef.current?.emit("draw:delete", { elementId });
  };

  const emitUpdate = (updatedElements) => {
    socketRef.current?.emit("draw:update", { updatedElements });
  };

  const emitRename = (name) => {
    setRoomName(name);
    socketRef.current?.emit("room:rename", { roomId, name });
  };

  const emitReaction = (emoji) => {
    socketRef.current?.emit("reaction:send", { emoji });
  };

  return {
    isConnected,
    isOwner,
    ownerId,
    peers,
    peerCursors,
    roomName,
    roomError,
    isLocked,
    setIsLocked,
    inviteToken,
    setInviteToken,
    emitStroke,
    emitCursor,
    emitDelete,
    emitUpdate,
    emitRename,
    emitReaction,
  };
};

export default useSocket;
