import { ArrowLeft, AlertCircle } from "lucide-react";
import styles from "./BoardNotFound.module.css";

const BoardNotFound = ({ error, onBackToDashboard, theme = "light" }) => {
  const isDark = theme === "dark";

  const getErrorMessage = () => {
    if (error === "Room not found") {
      return "This board does not exist or has been deleted by its owner.";
    }
    if (error?.toLowerCase().includes("access denied")) {
      return "You do not have permission to access this board. Please request an invite link.";
    }
    return error || "The requested board could not be loaded.";
  };

  return (
    <div className={`${styles.container} ${isDark ? styles.dark : ""}`}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <AlertCircle size={32} />
        </div>

        <h1 className={styles.title}>Board Not Found</h1>
        <p className={styles.description}>{getErrorMessage()}</p>

        <button
          type="button"
          onClick={onBackToDashboard}
          className={styles.backBtn}
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
};

export default BoardNotFound;
