import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const useSocket = ({
  roomId,
  onStrokeReceived,
  onInitialElements,
  onStrokeDeleted,
}) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [peers, setPeers] = useState([]);
  const [peerCursors, setPeerCursors] = useState({});

  // On entering a room
  useEffect(() => {
    // Connect to client-socket
    const socket = io("http://localhost:5000", {
      withCredentials: true,
      transports: ["websocket"],
    });
    socketRef.current = socket;

    // Event on connect
    socket.on("connect", () => {
      setIsConnected(true);

      // Event to join a room
      socket.emit("room:join", { roomId }, (res) => {
        if (res.success) {
          onInitialElements(res.currentElements);
          setPeers(res.activeUsers);
        }
      });
    });

    socket.on("draw:commit", ({ element }) => {
      // Capture the stroke and pass it down
      onStrokeReceived(element);
    });

    socket.on("user:joined", ({ user }) => {
      // Add user to active users list
      setPeers((prev) => [...prev, user]);
    });

    socket.on("user:left", ({ userId }) => {
      // Remove the user from active users list
      setPeers((prev) =>
        prev.filter((peer) => {
          if (peer._id !== userId) return peer;
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

    return () => {
      socket.disconnect();
    };
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

  return {
    isConnected,
    peers,
    peerCursors,
    emitStroke,
    emitCursor,
    emitDelete,
  };
};

export default useSocket;
