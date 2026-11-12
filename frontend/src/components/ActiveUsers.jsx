import { useEffect, useRef, useState } from "react";
import { Users, MousePointer2 } from "lucide-react";
import styles from "./ActiveUsers.module.css";

const ActiveUsers = ({
  peers = [],
  user,
  theme = "light",
  jumpToUser,
  ownerId,
}) => {
  const [showUsers, setShowUsers] = useState(false);
  const usersRef = useRef(null);

  const isDark = theme === "dark";

  // Close active users pop-up when clicked outside or on Escape
  useEffect(() => {
    if (!showUsers) return;

    const handlePointerDown = (e) => {
      if (!usersRef.current || !usersRef.current.contains(e.target)) {
        setShowUsers(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowUsers(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showUsers]);

  const currentUserId = (user?.id || user?._id)?.toString();

  // Pin current user ("You") to the very top of the list
  const sortedPeers = [...peers].sort((a, b) => {
    const aId = (a?.id || a?._id)?.toString();
    const bId = (b?.id || b?._id)?.toString();

    if (aId === currentUserId) return -1; // Float "You" to the top
    if (bId === currentUserId) return 1;
    return 0;
  });

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
            {sortedPeers.length === 0 ? (
              <div className={styles.emptyState}>No collaborators online</div>
            ) : (
              sortedPeers.map((peer) => {
                const peerId = (peer?.id || peer?._id)?.toString();
                const isCurrentUser = Boolean(
                  currentUserId && peerId && currentUserId === peerId,
                );
                const displayName = peer.name;
                const isOwner = (peer.id || peer._id) === ownerId;

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
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            if (e.currentTarget.nextSibling) {
                              e.currentTarget.nextSibling.style.display =
                                "flex";
                            }
                          }}
                        />
                      ) : null}
                      <div
                        className={styles.avatarFallback}
                        style={{ display: peer.picture ? "none" : "flex" }}
                      >
                        {displayName
                          ? displayName.charAt(0).toUpperCase()
                          : "U"}
                      </div>
                      <span
                        className={`${styles.onlineBadge} ${isDark ? styles.onlineBadgeDark : ""}`}
                      />
                    </div>

                    <div className={styles.userInfo}>
                      <div className={styles.userNameGroup}>
                        <span
                          className={`${styles.userName} ${isDark ? styles.userNameDark : ""}`}
                          title={displayName}
                        >
                          {isCurrentUser ? "You" : displayName}
                        </span>
                        {peer.color && (
                          <MousePointer2
                            size={11}
                            color={peer.color}
                            fill={peer.color}
                            style={{
                              transform: "rotate(-15deg)",
                              flexShrink: 0,
                            }}
                            title={`Cursor: ${peer.color}`}
                          />
                        )}
                      </div>
                      {isOwner && (
                        <span
                          className={`${styles.youBadge} ${isDark ? styles.youBadgeDark : ""}`}
                        >
                          Owner
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
