import { MousePointer2 } from "lucide-react";
import { worldToScreen } from "../utils/coordinates.js";
import styles from "./PeerCursors.module.css";

const PeerCursors = ({ peerCursors, pan, zoom }) => {
  if (!peerCursors) return null;

  return (
    <div className={styles.overlay}>
      {Object.entries(peerCursors).map(([userId, peer]) => {
        if (peer.x === undefined || peer.y === undefined) return null;

        const screenPoint = worldToScreen(
          { x: peer.x, y: peer.y },
          pan,
          zoom,
        );

        const userColor = peer.color || "#3b82f6";
        const userName = peer.name || "Peer";

        return (
          <div
            key={userId}
            className={styles.cursorItem}
            style={{
              transform: `translate(${screenPoint.x}px, ${screenPoint.y}px)`,
            }}
          >
            <MousePointer2
              size={18}
              fill={userColor}
              color={userColor}
              className={styles.pointerIcon}
            />
            <div
              className={styles.label}
              style={{ backgroundColor: userColor }}
            >
              {userName}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PeerCursors;
