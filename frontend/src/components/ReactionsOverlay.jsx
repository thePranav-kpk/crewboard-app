import styles from "./ReactionsOverlay.module.css";

const ReactionsOverlay = ({ reactions, theme }) => {
  if (!reactions || reactions.length === 0) return null;
  const isDark = theme === "dark";

  return (
    <div className={styles.container}>
      {reactions.map((r) => (
        <div
          key={r.id}
          className={styles.reactionItem}
          style={{ "--offset-x": `${r.offset || 0}px` }}
        >
          <span className={styles.emoji}>{r.emoji}</span>
          <span
            className={`${styles.userName} ${isDark ? styles.userNameDark : ""}`}
          >
            {r.userName}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ReactionsOverlay;
