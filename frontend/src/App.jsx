/* eslint-disable no-unused-vars */
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
      <Whiteboard />
    </div>
  );
};

export default App;
