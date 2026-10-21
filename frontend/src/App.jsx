import { useAuth } from "./context/AuthContext.jsx";
import Whiteboard from "./components/Whiteboard.jsx";
import styles from "./App.module.css";

const App = () => {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading CrewBoard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.loginContainer}>
        <h1 className={styles.loginTitle}>CrewBoard</h1>
        <p className={styles.loginSubtitle}>
          Real-Time Collaborative Whiteboard
        </p>
        <button onClick={login} className={styles.loginButton}>
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className={styles.appContainer}>
      <div className={styles.headerBadge}>
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            onError={(e) => {
              // If the image link fails to load, hide image and show fallback
              e.currentTarget.style.display = "none";
              if (e.currentTarget.nextSibling) {
                e.currentTarget.nextSibling.style.display = "flex";
              }
            }}
            className={styles.avatarImg}
          />
        ) : null}

        {/* Letter Fallback Badge */}
        <div
          style={{ display: user.picture ? "none" : "flex" }}
          className={styles.avatarFallback}
        >
          {user.name ? user.name.charAt(0) : "U"}
        </div>

        <span className={styles.userName}>{user.name}</span>
        <button onClick={logout} className={styles.logoutButton}>
          Logout
        </button>
      </div>
      <Whiteboard />
    </div>
  );
};

export default App;
