import { useAuth } from "./context/AuthContext.jsx";
import Whiteboard from "./components/Whiteboard.jsx";

const App = () => {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <p>Loading CrewBoard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "2.5rem" }}>CrewBoard</h1>
        <p style={{ margin: 0, color: "#666" }}>
          Real-Time Collaborative Whiteboard
        </p>
        <button
          onClick={login}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            borderRadius: "8px",
            border: "1px solid #ddd",
            backgroundColor: "#fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          }}
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(6px)",
          padding: "8px 16px",
          borderRadius: 24,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
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
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : null}

        {/* Letter Fallback Badge */}
        <div
          style={{
            display: user.picture ? "none" : "flex",
            width: 28,
            height: 28,
            borderRadius: "50%",
            backgroundColor: "#6366f1", // Indigo accent
            color: "#ffffff",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "14px",
            textTransform: "uppercase",
          }}
        >
          {user.name ? user.name.charAt(0) : "U"}
        </div>

        <span style={{ fontWeight: 600, fontSize: "14px" }}>{user.name}</span>
        <button
          onClick={logout}
          style={{
            padding: "4px 10px",
            fontSize: "12px",
            cursor: "pointer",
            borderRadius: "6px",
            border: "1px solid #ccc",
            background: "#fff",
          }}
        >
          Logout
        </button>
      </div>
      <Whiteboard />
    </div>
  );
};

export default App;
