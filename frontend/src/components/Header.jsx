import { useState, useEffect, useRef } from "react";
import {
  Share2,
  Check,
  Sun,
  Moon,
  LogOut,
  Download,
  Lock,
  Unlock,
  Smile,
} from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useAuth } from "../context/AuthContext.jsx";
import ExportModal from "./ExportModal.jsx";
import ActiveUsers from "./ActiveUsers.jsx";
import apiClient from "../services/api.js";
import styles from "./Header.module.css";

const Header = ({
  roomId = "general",
  roomName,
  isLocked,
  isOwner,
  token = "",
  theme,
  handleToggleTheme,
  elements = [],
  peers,
  jumpToUser,
  ownerId,
  onSendReaction,
}) => {
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const isDark = theme === "dark";

  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  // Close dropdown when clicked outside or on Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showPicker]);

  const handleCopy = async () => {
    try {
      // Paste JSON payload storing roomId and token as string
      const payload = JSON.stringify({ roomId, token });
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleToggleLock = async () => {
    try {
      await apiClient.patch(`/room/${roomId}/lock`);
    } catch (err) {
      console.error("Failed to toggle room lock: ", err);
    }
  };

  return (
    <header
      className={`${styles.headerContainer} ${isDark ? styles.headerContainerDark : ""}`}
    >
      {/* Active Users */}
      <ActiveUsers
        peers={peers}
        user={user}
        theme={theme}
        jumpToUser={jumpToUser}
        ownerId={ownerId}
      />

      <div
        className={`${styles.divider} ${isDark ? styles.dividerDark : ""}`}
      />

      {/* Display Share button only for owner or if room is not locked */}
      {isOwner || !isLocked ? (
        <button
          type="button"
          onClick={handleCopy}
          className={`${styles.shareButton} ${isDark ? styles.shareButtonDark : ""} ${copied ? styles.shareButtonSuccess : ""}`}
          title="Copy room invite link"
        >
          {copied ? <Check size={13} /> : <Share2 size={13} />}
          <span>{copied ? "Copied!" : "Share"}</span>
        </button>
      ) : (
        <span
          className={`${styles.lockedBadge} ${isDark ? styles.lockedBadgeDark : ""}`}
          title="Board locked by owner"
        >
          <Lock size={13} /> Locked
        </span>
      )}

      {/* Display Room lock button only for owner */}
      {isOwner && (
        <button
          type="button"
          onClick={handleToggleLock}
          className={`${styles.iconButton} ${isDark ? styles.iconButtonDark : ""}`}
          title={
            isLocked
              ? "Unlock board (allow new members to join)"
              : "Lock board (prevent new members)"
          }
        >
          {isLocked ? <Lock size={15} color="#ef4444" /> : <Unlock size={15} />}
        </button>
      )}

      <div
        className={`${styles.divider} ${isDark ? styles.dividerDark : ""}`}
      />

      {/* Emoji Reactions Keyboard Dropdown */}
      <div className={styles.pickerWrapper} ref={pickerRef}>
        <button
          type="button"
          onClick={() => setShowPicker((prev) => !prev)}
          className={`${styles.iconButton} ${isDark ? styles.iconButtonDark : ""}`}
          title="Send Emoji Reaction"
          aria-label="Send Emoji Reaction"
        >
          <Smile size={16} />
        </button>

        {showPicker && (
          <div className={styles.pickerDropdown}>
            <EmojiPicker
              theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
              onEmojiClick={(emojiData) => {
                onSendReaction?.(emojiData.emoji);
              }}
              width={340}
              height={400}
              searchDisabled={false}
              lazyLoadEmojis={true}
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}
      </div>

      <div
        className={`${styles.divider} ${isDark ? styles.dividerDark : ""}`}
      />

      {/* Theme Toggle & Export */}
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
          roomName={roomName}
          elements={elements}
          theme={theme}
          handleClose={() => setShowExport(false)}
        />
      )}

      <div
        className={`${styles.divider} ${isDark ? styles.dividerDark : ""}`}
      />

      {/* User Profile & Logout */}
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
