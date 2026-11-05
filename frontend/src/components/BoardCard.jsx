import {
  Calendar,
  Clock,
  Check,
  Share2,
  Download,
  Trash2,
  Pencil,
} from "lucide-react";
import { formatDate, formatCreationDate } from "../utils/dashboardUtils";
import styles from "./BoardCard.module.css";

const BoardCard = ({
  room,
  isOwner,
  isEditing,
  editingName,
  onStartRename,
  onRenameChange,
  onRenameKeyDown,
  onSaveRename,
  onOpenBoard,
  onCopyLink,
  isCopied,
  onExportBoard,
  isExporting,
  onDeleteBoard,
}) => {
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
          {isEditing ? (
            <input
              autoFocus
              className={styles.cardTitleInput}
              value={editingName}
              onChange={(e) => onRenameChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => onRenameKeyDown(e, room)}
              onBlur={() => onSaveRename(room)}
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
                  onStartRename(room.roomId, room.name || "Untitled Board");
                }}
              />
            )}
          </span>
        </div>

        {/* Card Footer with relative time & quick actions */}
        <div className={styles.cardFooter}>
          <div className={styles.timeInfo}>
            <div
              className={styles.timeRow}
              title={`Created on ${formatCreationDate(room.createdAt)}`}
            >
              <Calendar size={11} />
              <span>Created {formatCreationDate(room.createdAt)}</span>
            </div>
            <div
              className={styles.timeRow}
              title={`Last updated ${formatDate(room.updatedAt)}`}
            >
              <Clock size={11} />
              <span>Updated {formatDate(room.updatedAt)}</span>
            </div>
          </div>

          <div className={styles.cardActions}>
            {/* Share Button */}
            <button
              type="button"
              onClick={(e) => onCopyLink(e, room)}
              className={styles.cardActionBtn}
              title="Copy share link"
              aria-label="Copy share link"
            >
              {isCopied ? (
                <Check size={14} color="#10b981" />
              ) : (
                <Share2 size={14} />
              )}
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={(e) => onExportBoard(e, room)}
              className={styles.cardActionBtn}
              title="Export Whiteboard"
              aria-label="Export Whiteboard"
            >
              {isExporting ? (
                <Check size={14} color="#10b981" />
              ) : (
                <Download size={14} />
              )}
            </button>

            {/* Delete Button (Owner only) */}
            {isOwner && (
              <button
                type="button"
                onClick={(e) => onDeleteBoard(e, room)}
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
};

export default BoardCard;
