import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Share2,
  Trash2,
  Clock,
  LogOut,
  Sun,
  Moon,
  LayoutGrid,
  Check,
  Pencil,
  Download,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import apiClient from "../services/api";
import styles from "./Dashboard.module.css";
import { downloadCanvasImage } from "../utils/exportCanvas";

const formatDate = (updatedAt) => {
  if (!updatedAt) return "";

  const date = new Date(updatedAt);
  const now = new Date();

  const millisecDiff = Math.floor(now - date);
  const secDiff = Math.floor(millisecDiff / 1000);
  const minDiff = Math.floor(secDiff / 60);
  const hourDiff = Math.floor(minDiff / 60);
  const dateDiff = Math.floor(hourDiff / 24);
  const monthDiff = Math.floor(dateDiff / 30);
  const yearDiff = Math.floor(monthDiff / 12);

  const formatUnit = (val, unit) =>
    `${val} ${val === 1 ? unit : unit + "s"} ago`;

  if (yearDiff) return formatUnit(yearDiff, "year");
  if (monthDiff) return formatUnit(monthDiff, "month");
  if (dateDiff) return formatUnit(dateDiff, "day");
  if (hourDiff) return formatUnit(hourDiff, "hour");
  if (minDiff) return formatUnit(minDiff, "minute");
  if (secDiff) return formatUnit(secDiff, "second");

  return "Just now";
};

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

    navigator.clipboard.writeText(
      `${window.location.origin}/room/${room.roomId}?token=${room.inviteToken}`,
    );
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
                <div
                  key={room.roomId}
                  onClick={() => onOpenBoard(room.roomId, room.inviteToken)}
                  className={styles.boardCard}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onOpenBoard(room.roomId, room.inviteToken);
                    }
                  }}
                >
                  {/* Card Thumbnail */}
                  <div className={styles.cardPreview}>
                    <img
                      src="/logo.jpg"
                      alt="Board preview"
                      className={styles.cardLogoWatermark}
                    />
                  </div>

                  {/* Card Body */}
                  <div className={styles.cardBody}>
                    <div className={styles.cardTitleRow}>
                      {editingRoomId === room.roomId ? (
                        <input
                          autoFocus
                          className={styles.cardTitleInput}
                          value={roomName}
                          onChange={(e) => setRoomName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => handleKeyDown(e, room)}
                          onBlur={() => handleSaveRoomName(room)}
                        />
                      ) : (
                        <h3 className={styles.boardTitle} title={room.name}>
                          {room.name || "Untitled Board"}
                        </h3>
                      )}
                      <span
                        className={`${styles.roleBadge} ${
                          isOwner ? styles.roleOwner : styles.roleMember
                        }`}
                      >
                        {isOwner ? "Owner" : "Member"}
                        {isOwner && (
                          <Pencil
                            size={12}
                            className={styles.editBadgeIcon}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRoomId(room.roomId);
                              setRoomName(room.name || "Untitled Board");
                            }}
                          />
                        )}
                      </span>
                    </div>

                    {/* Card Footer with relative time & quick actions */}
                    <div className={styles.cardFooter}>
                      <div className={styles.timeInfo}>
                        <Clock size={13} />
                        <span>{formatDate(room.updatedAt)}</span>
                      </div>

                      <div className={styles.cardActions}>
                        {/* Share Button */}
                        <button
                          type="button"
                          onClick={(e) => handleCopyLink(e, room)}
                          className={styles.cardActionBtn}
                          title="Copy share link"
                          aria-label="Copy share link"
                        >
                          {copiedRoomId === room.roomId ? (
                            <Check size={14} color="#10b981" />
                          ) : (
                            <Share2 size={14} />
                          )}
                        </button>

                        {/* Download Button */}
                        <button
                          type="button"
                          onClick={(e) => handleExportBoard(e, room)}
                          className={styles.cardActionBtn}
                          title="Export Whiteboard"
                          aria-label="Export Whiteboard"
                        >
                          {exportingRoomId === room.roomId ? (
                            <Check size={14} color="#10b981" />
                          ) : (
                            <Download size={14} />
                          )}
                        </button>

                        {/* Delete Button (Owner only) */}
                        {isOwner && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteBoard(e, room)}
                            className={`${styles.cardActionBtn} ${styles.deleteBtn}`}
                            title="Delete board"
                            aria-label="Delete board"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
