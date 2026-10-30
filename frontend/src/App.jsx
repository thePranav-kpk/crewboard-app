import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext.jsx";
import Whiteboard from "./components/Whiteboard.jsx";
import Dashboard from "./components/Dashboard.jsx";
import LandingPage from "./components/LandingPage.jsx";
import styles from "./App.module.css";

const App = () => {
  const [activeRoom, setActiveRoom] = useState(() => {
    const match = window.location.pathname.match(/^\/room\/([^/]+)/);
    if (match) {
      const params = new URLSearchParams(window.location.search);
      return { roomId: match[1], token: params.get("token") || "" };
    }
    return null;
  });

  // Lazy initial state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  // Store theme in localStorage
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const handlePopState = () => {
      const match = window.location.pathname.match(/^\/room\/([^/]+)/);
      if (match) {
        const params = new URLSearchParams(window.location.search);
        setActiveRoom({ roomId: match[1], token: params.get("token") || "" });
      } else {
        setActiveRoom(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const { user, loading, login } = useAuth();

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleOpenBoard = (roomId, token) => {
    setActiveRoom({ roomId, token });
    const url = `/room/${roomId}${token ? `?token=${token}` : ""}`;
    window.history.pushState(null, "", url);
  };

  const handleBackToDashboard = () => {
    setActiveRoom(null);
    window.history.pushState(null, "", "/");
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  if (!user) {
    return <LandingPage onLogin={login} />;
  }

  if (activeRoom) {
    return (
      <div className={styles.appContainer}>
        <Whiteboard
          roomId={activeRoom.roomId}
          token={activeRoom.token}
          onBackToDashboard={handleBackToDashboard}
          theme={theme}
          handleToggleTheme={handleToggleTheme}
        />
      </div>
    );
  }

  return (
    <Dashboard
      onOpenBoard={handleOpenBoard}
      theme={theme}
      handleToggleTheme={handleToggleTheme}
    />
  );
};

export default App;
