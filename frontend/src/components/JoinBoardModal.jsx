import { useState } from "react";
import apiClient from "../services/api";
import { parseInviteData } from "../utils/dashboardUtils";
import styles from "./JoinBoardModal.module.css";

const JoinBoardModal = ({ isOpen, onClose, onOpenBoard }) => {
  // States for copying roomId, inviteToken
  const [joinRoomId, setJoinRoomId] = useState("");
  const [joinRoomToken, setJoinRoomToken] = useState("");
  const [joinError, setJoinError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  if (!isOpen) return null;

  const handleRoomIdChange = (e) => {
    const value = e.target.value;
    setJoinError("");

    const parsed = parseInviteData(value);
    // If valid parsed data
    if (parsed) {
      setJoinRoomId(parsed.roomId);
      if (parsed.token) setJoinRoomToken(parsed.token);
    }
    // If plain text
    else {
      setJoinRoomId(value);
    }
  };

  const handleRoomTokenChange = (e) => {
    const value = e.target.value;
    setJoinError("");

    const parsed = parseInviteData(value);
    // If valid parsed data
    if (parsed) {
      setJoinRoomId(parsed.roomId);
      if (parsed.token) setJoinRoomToken(parsed.token);
    }
    // If plain text
    else {
      setJoinRoomToken(value);
    }
  };

  const handleJoinSubmit = async () => {
    const trimmedId = joinRoomId.trim();
    const trimmedToken = joinRoomToken.trim();

    if (!trimmedId) {
      setJoinError("Room Id is required");
      return;
    }
    try {
      setJoinError("");
      setIsJoining(true);

      const query = trimmedToken
        ? `?token=${encodeURIComponent(trimmedToken)}`
        : "";

      const response = await apiClient.get(`/room/${trimmedId}${query}`);

      if (response.data?.room) {
        onOpenBoard(joinRoomId.trim(), joinRoomToken.trim());
        setJoinRoomId("");
        setJoinRoomToken("");
        onClose();
      }
    } catch (err) {
      setJoinError(
        err.response?.data?.message || "Room not found or access denied",
      );
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Join a Board</h3>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            title="Close"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className={styles.modalSubtitle}>
          Paste a copied invite payload, or enter room details manually.
        </p>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>
            Room ID <span className={styles.requiredStar}>*</span>
          </label>
          <input
            className={styles.modalInput}
            placeholder="Paste payload or enter Room ID"
            value={joinRoomId}
            onChange={handleRoomIdChange}
            onKeyDown={(e) => e.key === "Enter" && handleJoinSubmit()}
            autoFocus
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>
            Invite Token{" "}
            <span className={styles.inputLabelOptional}>
              (Optional for existing members)
            </span>
          </label>
          <input
            className={styles.modalInput}
            placeholder="Paste payload or enter Token"
            value={joinRoomToken}
            onChange={handleRoomTokenChange}
            onKeyDown={(e) => e.key === "Enter" && handleJoinSubmit()}
          />
        </div>

        {joinError && <p className={styles.modalError}>{joinError}</p>}

        <div className={styles.modalActions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.joinSubmitBtn}
            onClick={handleJoinSubmit}
            disabled={isJoining}
          >
            {isJoining ? "Joining..." : "Join Board"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinBoardModal;
