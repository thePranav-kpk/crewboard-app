import { useState } from "react";
import { ChevronLeft, Pencil } from "lucide-react";
import styles from "./BoardTitleBar.module.css";
import apiClient from "../services/api.js";

const BoardTitleBar = ({
  roomId,
  roomName,
  isOwner,
  onBackToDashboard,
  theme,
  emitRename,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(roomName);

  const isDark = theme === "dark";

  const handleSaveRoomName = async () => {
    const trimmedValue = titleDraft.trim();
    if (trimmedValue) {
      await apiClient.patch(`/room/${roomId}`, { name: trimmedValue });
      emitRename(trimmedValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSaveRoomName();
    } else if (e.key === "Escape") {
      setTitleDraft(roomName);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`${styles.navContainer} ${isDark ? styles.navContainerDark : ""}`}
    >
      {/* Back to Dashboard */}
      {onBackToDashboard && (
        <>
          <button
            type="button"
            onClick={onBackToDashboard}
            className={`${styles.backButton} ${isDark ? styles.backButtonDark : ""}`}
            title="Back to Dashboard"
          >
            <ChevronLeft size={15} />
          </button>
          <div
            className={`${styles.divider} ${isDark ? styles.dividerDark : ""}`}
          />
        </>
      )}
      {/* Room Name */}
      <div className={styles.roomSection}>
        {isEditing ? (
          <input
            autoFocus
            className={`${styles.roomInput} ${isDark ? styles.roomInputDark : ""}`}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSaveRoomName}
          />
        ) : (
          <span
            className={`${styles.roomBadge} ${isDark ? styles.roomBadgeDark : ""}`}
            title={`Room ID: ${roomId}`}
          >
            {roomName === null ? "..." : roomName || "Untitled Board"}
            {isOwner && (
              <Pencil
                size={12}
                className={styles.pencilIcon}
                onClick={() => {
                  setTitleDraft(roomName || "Untitled Board");
                  setIsEditing(true);
                }}
              />
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default BoardTitleBar;
