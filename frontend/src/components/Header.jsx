import { useState } from "react";
import {
  Share2,
  Check,
  Sun,
  Moon,
  LogOut,
  Download,
  ChevronLeft,
  Pencil,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import ExportModal from "./ExportModal.jsx";
import styles from "./Header.module.css";
import apiClient from "../services/api.js";

const Header = ({
  roomId = "general",
  roomName,
  token = "",
  theme,
  handleToggleTheme,
  onBackToDashboard,
  elements = [],
  emitRename,
}) => {
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(roomName);

  const isDark = theme === "dark";

  const handleCopy = async () => {
    try {
      const inviteUrl = `${window.location.origin}/room/${roomId}${token ? `?token=${token}` : ""}`;
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

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
    <header
      className={`${styles.headerContainer} ${isDark ? styles.headerContainerDark : ""}`}
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
            <span>Boards</span>
          </button>
          <div
            className={`${styles.divider} ${isDark ? styles.dividerDark : ""}`}
          />
        </>
      )}
      {/* 1. Room & Share Link */}
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
            <Pencil
              size={12}
              className={styles.pencilIcon}
              onClick={() => {
                setTitleDraft(roomName || "Untitled Board");
                setIsEditing(true);
              }}
            />
          </span>
        )}
        <button
          type="button"
          onClick={handleCopy}
          className={`${styles.shareButton} ${isDark ? styles.shareButtonDark : ""} ${copied ? styles.shareButtonSuccess : ""}`}
          title="Copy room invite link"
        >
          {copied ? <Check size={13} /> : <Share2 size={13} />}
          <span>{copied ? "Copied!" : "Share"}</span>
        </button>
      </div>

      <div
        className={`${styles.divider} ${isDark ? styles.dividerDark : ""}`}
      />

      {/* 2. Theme Toggle & Export */}
      <button
        type="button"
        onClick={handleToggleTheme}
        className={`${styles.iconButton} ${isDark ? styles.iconButtonDark : ""}`}
        title={`Switch to ${isDark ? "Light" : "Dark"} board`}
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <button
        type="button"
        onClick={() => setShowExport((prev) => !prev)}
        className={`${styles.iconButton} ${isDark ? styles.iconButtonDark : ""} ${
          showExport
            ? isDark
              ? styles.iconButtonActiveDark
              : styles.iconButtonActive
            : ""
        }`}
        title="Export Whiteboard"
        aria-label="Export Whiteboard"
      >
        <Download size={16} />
      </button>

      {/* Export Popover */}
      {showExport && (
        <ExportModal
          elements={elements}
          theme={theme}
          handleClose={() => setShowExport(false)}
        />
      )}

      <div
        className={`${styles.divider} ${isDark ? styles.dividerDark : ""}`}
      />

      {/* 3. User Profile & Logout */}
      {user && (
        <div className={styles.userSection}>
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user?.name || "User"}
              className={styles.avatarImg}
            />
          ) : (
            <div className={styles.avatarFallback}>
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
          )}

          <span
            className={`${styles.userName} ${isDark ? styles.userNameDark : ""}`}
            title={user.name}
          >
            {user.name}
          </span>

          <button
            type="button"
            onClick={logout}
            className={styles.logoutButton}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={15} />
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
