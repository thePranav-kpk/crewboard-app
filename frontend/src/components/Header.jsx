import { useState } from "react";
import { Share2, Check, Sun, Moon, LogOut, Download } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import ExportModal from "./ExportModal.jsx";
import styles from "./Header.module.css";

const Header = ({
  roomId = "general",
  theme,
  handleToggleTheme,
  elements = [],
}) => {
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const isDark = theme === "dark";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <header
      className={`${styles.headerContainer} ${isDark ? styles.headerContainerDark : ""}`}
    >
      {/* 1. Room & Share Link */}
      <div className={styles.roomSection}>
        <span
          className={`${styles.roomBadge} ${isDark ? styles.roomBadgeDark : ""}`}
        >
          {roomId}
        </span>
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
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.name || "User"}
              className={styles.avatarImg}
              onError={(e) => {
                e.currentTarget.style.display = "none";
                if (e.currentTarget.nextSibling) {
                  e.currentTarget.nextSibling.style.display = "flex";
                }
              }}
            />
          ) : null}

          <div
            style={{ display: user.picture ? "none" : "flex" }}
            className={styles.avatarFallback}
          >
            {user.name ? user.name.charAt(0) : "U"}
          </div>

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
