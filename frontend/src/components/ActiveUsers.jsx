import { useEffect, useRef, useState } from "react";
import { Users } from "lucide-react";
import styles from "./ActiveUsers.module.css";

const ActiveUsers = ({ peers = [], user, theme = "light", jumpToUser }) => {
  const [showUsers, setShowUsers] = useState(false);
  const usersRef = useRef(null);

  const isDark = theme === "dark";

  // To close active users pop-up
  useEffect(() => {
    const handlePointerDown = (e) => {
      if (!usersRef.current || !usersRef.current.contains(e.target)) {
        setShowUsers(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div ref={usersRef} className={styles.container}>
      <button
        type="button"
        onClick={() => setShowUsers((prev) => !prev)}
        className={`${styles.triggerButton} ${isDark ? styles.triggerButtonDark : ""} ${
          showUsers
            ? isDark
              ? styles.triggerButtonActiveDark
              : styles.triggerButtonActive
            : ""
        }`}
        title="Active Collaborators"
      >
        <span className={styles.pulseDot} />
        <Users size={13} />
        <span>Users</span>
        <span
          className={`${styles.badgeCount} ${isDark ? styles.badgeCountDark : ""}`}
        >
          {peers.length}
        </span>
      </button>

      {showUsers && (
        <div
          className={`${styles.popover} ${isDark ? styles.popoverDark : ""}`}
        >
          <div
            className={`${styles.popoverHeader} ${isDark ? styles.popoverHeaderDark : ""}`}
          >
            <span>Collaborators</span>
            <span>{peers.length} online</span>
          </div>

          <div className={styles.userList}>
            {peers.length === 0 ? (
              <div className={styles.emptyState}>No collaborators online</div>
            ) : (
              peers.map((peer) => {
                const isCurrentUser = peer.id === user?.id;
                const displayName = peer.name;

                return (
                  <div
                    key={peer.id}
                    className={`${styles.userItem} ${isDark ? styles.userItemDark : ""}`}
                    onClick={() => {
                      {
                        !isCurrentUser && jumpToUser(peer.id);
                        setShowUsers(false);
                      }
                    }}
                  >
                    <div className={styles.avatarContainer}>
                      {peer.picture ? (
                        <img
                          src={peer.picture}
                          alt={displayName || "User"}
                          className={styles.avatarImg}
                        />
                      ) : (
                        <div className={styles.avatarFallback}>
                          {displayName
                            ? displayName.charAt(0).toUpperCase()
                            : "U"}
                        </div>
                      )}
                      <span
                        className={`${styles.onlineBadge} ${isDark ? styles.onlineBadgeDark : ""}`}
                      />
                    </div>

                    <div className={styles.userInfo}>
                      <span
                        className={`${styles.userName} ${isDark ? styles.userNameDark : ""}`}
                        title={displayName}
                      >
                        {displayName}
                      </span>
                      {isCurrentUser && (
                        <span
                          className={`${styles.youBadge} ${isDark ? styles.youBadgeDark : ""}`}
                        >
                          You
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveUsers;
