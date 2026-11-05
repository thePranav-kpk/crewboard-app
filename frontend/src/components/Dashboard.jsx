import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  LogOut,
  Sun,
  Moon,
  LayoutGrid,
  LogIn,
} from "lucide-react";
import JoinBoardModal from "./JoinBoardModal";
import BoardCard from "./BoardCard";
import { useAuth } from "../context/AuthContext";
import apiClient from "../services/api";
import styles from "./Dashboard.module.css";
import { downloadCanvasImage } from "../utils/exportCanvas";

const Dashboard = ({
  onOpenBoard,
  theme = localStorage.getItem("theme") || "light",
  handleToggleTheme,
}) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedRoomId, setCopiedRoomId] = useState(null);
  const [exportingRoomId, setExportingRoomId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [editingRoomId, setEditingRoomId] = useState(null);
  const [roomName, setRoomName] = useState("");

  const { user, logout } = useAuth();
  const isDark = theme === "dark";

  const [showJoinModal, setShowJoinModal] = useState(false);

  // Fetch recent rooms on login
  useEffect(() => {
    const fetchRecentRooms = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get("/room/recent");
        setRooms(response.data.rooms || []);
      } catch {
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentRooms();
  }, []);

  const handleAddBoard = async () => {
    try {
      const response = await apiClient.post("/room", {
        name: "Untitled Board",
      });
      onOpenBoard(response.data.room.roomId, response.data.room.inviteToken);
    } catch (err) {
      console.error("Failed to create board:", err);
    }
  };

  const handleCopyLink = (e, room) => {
    e.stopPropagation();

    // Paste JSON payload storing roomId and token as string
    const payload = JSON.stringify({
      roomId: room.roomId,
      token: room.inviteToken || "",
    });
    navigator.clipboard.writeText(payload);

    setCopiedRoomId(room.roomId);

    setTimeout(() => setCopiedRoomId(null), 2000);
  };

  const handleDeleteBoard = async (e, room) => {
    e.stopPropagation();

    if (
      window.confirm(
        `Are you sure you want to delete "${room.name || "Untitled Board"}"?`,
      )
    ) {
      try {
        await apiClient.delete(`/room/${room.roomId}`);
        setRooms((prev) => prev.filter((r) => r.roomId !== room.roomId));
      } catch (err) {
        alert(err.response?.data?.message || "Failed to delete board");
      }
    }
  };

  const filteredRooms =
    rooms?.filter((room) =>
      room.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  const handleSaveRoomName = async (room) => {
    const trimmedValue = roomName.trim();
    if (trimmedValue) {
      await apiClient.patch(`/room/${room.roomId}`, { name: trimmedValue });
      setRooms((prev) =>
        prev.map((r) =>
          r.roomId === room.roomId ? { ...r, name: trimmedValue } : r,
        ),
      );
    }
    setEditingRoomId(null);
  };

  const handleKeyDown = (e, room) => {
    if (e.key === "Enter") {
      handleSaveRoomName(room);
    } else if (e.key === "Escape") {
      setEditingRoomId(null);
    }
  };

  const handleExportBoard = async (e, room) => {
    e.stopPropagation();
    const response = await apiClient.get(
      `/room/${room.roomId}?token=${room.inviteToken}`,
    );
    setExportingRoomId(room.roomId);

    setTimeout(() => setExportingRoomId(null), 2000);

    const elements = response.data.room.elements || [];
    const fileName = `${room?.name?.trim() || "Untitled Board"}.png`;

    downloadCanvasImage(elements, "current", theme, fileName);
  };

  return (
    <div
      className={`${styles.dashboardContainer} ${isDark ? styles.dark : ""}`}
    >
      {/* 1. Navbar */}
      <header className={styles.navbar}>
        <div className={styles.brand}>
          <img
            src="/logo.jpg"
            alt="CrewBoard Logo"
            className={styles.brandLogo}
          />
          <span className={styles.brandName}>CrewBoard</span>
        </div>

        <div className={styles.navRight}>
          {/* User Profile */}
          <div className={styles.userPill}>
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user?.name || "User"}
                className={styles.avatar}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // If external image fails to load, hide image and show fallback
                  e.currentTarget.style.display = "none";
                  if (e.currentTarget.nextSibling) {
                    e.currentTarget.nextSibling.style.display = "flex";
                  }
                }}
              />
            ) : null}
            <div
              className={styles.avatarFallback}
              style={{ display: user?.picture ? "none" : "flex" }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <span className={styles.userName}>{user?.name}</span>
          </div>

          {/* Join Board Trigger Button */}
          <button
            type="button"
            onClick={() => setShowJoinModal(true)}
            className={styles.joinNavBtn}
            title="Join an existing board"
          >
            <LogIn size={14} />
            <span>Join Board</span>
          </button>

          {/* Theme Toggle Button */}
          {handleToggleTheme && (
            <button
              type="button"
              onClick={handleToggleTheme}
              className={styles.iconBtn}
              title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          )}

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => logout()}
            className={styles.logoutBtn}
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* 2. Main Content */}
      <main className={styles.mainContent}>
        <section className={styles.dashboardHeader}>
          <div className={styles.headerTopRow}>
            <div>
              <h1 className={styles.headerTitle}>Recent Boards</h1>
              <p className={styles.headerSubtitle}>
                Collaborative spaces you own or contribute to.
              </p>
            </div>

            <div className={styles.headerActions}>
              {/* Search Bar */}
              <div className={styles.searchWrapper}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Filter boards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              {/* New Board Button (+) */}
              <button
                type="button"
                onClick={handleAddBoard}
                className={styles.newBoardBtn}
              >
                <Plus size={18} strokeWidth={2.5} />
                <span>New Board</span>
              </button>
            </div>
          </div>
        </section>

        {/* 3. Boards Grid */}
        {loading ? (
          <div className={styles.loadingWrapper}>
            <div className={styles.spinner} />
            <span className={styles.headerSubtitle}>
              Fetching recent rooms...
            </span>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconWrapper}>
              <LayoutGrid size={28} />
            </div>
            <h2 className={styles.emptyTitle}>
              {searchQuery ? "No matching boards found" : "No boards yet"}
            </h2>
            <p className={styles.emptyDesc}>
              {searchQuery
                ? `No boards match "${searchQuery}". Try a different search.`
                : "Create your first collaborative canvas to sketch diagrams, wireframes, and brainstorm in real-time."}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={handleAddBoard}
                className={styles.newBoardBtn}
              >
                <Plus size={18} strokeWidth={2.5} />
                <span>Create your first board</span>
              </button>
            )}
          </div>
        ) : (
          <div className={styles.boardsGrid}>
            {filteredRooms.map((room) => {
              const currentUserId = user?.id || user?._id;
              const ownerId = room.owner?._id || room.owner;
              const isOwner = Boolean(
                ownerId &&
                currentUserId &&
                ownerId.toString() === currentUserId.toString(),
              );

              return (
                <BoardCard
                  key={room.roomId}
                  room={room}
                  isOwner={isOwner}
                  isEditing={editingRoomId === room.roomId}
                  editingName={roomName}
                  onStartRename={(id, name) => {
                    setEditingRoomId(id);
                    setRoomName(name);
                  }}
                  onRenameChange={setRoomName}
                  onRenameKeyDown={handleKeyDown}
                  onSaveRename={handleSaveRoomName}
                  onOpenBoard={onOpenBoard}
                  onCopyLink={handleCopyLink}
                  isCopied={copiedRoomId === room.roomId}
                  onExportBoard={handleExportBoard}
                  isExporting={exportingRoomId === room.roomId}
                  onDeleteBoard={handleDeleteBoard}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* 4. Join Board Modal Dialog */}
      <JoinBoardModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onOpenBoard={onOpenBoard}
      />
    </div>
  );
};

export default Dashboard;
