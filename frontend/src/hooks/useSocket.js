import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const useSocket = ({
  roomId,
  token,
  onStrokeReceived,
  onInitialElements,
  onStrokeDeleted,
  onElementsUpdated,
}) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [peers, setPeers] = useState([]);
  const [peerCursors, setPeerCursors] = useState({});
  const [roomName, setRoomName] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

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
        }
      });
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

    socket.on("room:rename", ({ name }) => {
      setRoomName(name);
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

  return {
    isConnected,
    isOwner,
    peers,
    peerCursors,
    roomName,
    emitStroke,
    emitCursor,
    emitDelete,
    emitUpdate,
    emitRename,
  };
};

export default useSocket;
