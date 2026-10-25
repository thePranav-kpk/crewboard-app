import { useRef, useState, useEffect } from "react";
import { X, Download, Copy, Check } from "lucide-react";
import {
  copyCanvasToClipboard,
  downloadCanvasImage,
} from "../utils/exportCanvas.js";
import styles from "./ExportModal.module.css";

const ExportModal = ({ elements, theme, handleClose }) => {
  const [background, setBackground] = useState("current");
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const containerRef = useRef(null);
  const isDark = theme === "dark";

  const handleDownload = async () => {
    setIsDownloading(true);
    await downloadCanvasImage(elements, background, theme);
    setIsDownloading(false);
  };

  const handleCopyToClipboard = async () => {
    try {
      await copyCanvasToClipboard(elements, background, theme);
      setCopied(true);
    } finally {
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Check for any content
  const hasContent = elements && elements.length > 0;

  // To remove pop-up if hovered outside pop-up container
  useEffect(() => {
    const handlePointerDown = (e) => {
      if (!containerRef.current || !containerRef.current.contains(e.target))
        handleClose();
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [handleClose]);

  return (
    <div
      ref={containerRef}
      className={`${styles.popover} ${isDark ? styles.popoverDark : ""}`}
    >
      {/* Header */}
      <div className={styles.headerRow}>
        <span className={`${styles.title} ${isDark ? styles.titleDark : ""}`}>
          Export Whiteboard
        </span>
        <button
          type="button"
          onClick={handleClose}
          className={`${styles.closeButton} ${isDark ? styles.closeButtonDark : ""}`}
          title="Close export menu"
          aria-label="Close export menu"
        >
          <X size={15} />
        </button>
      </div>

      {/* Background Options */}
      <div>
        <div
          className={`${styles.sectionLabel} ${isDark ? styles.sectionLabelDark : ""}`}
        >
          Background
        </div>
        <div
          className={`${styles.pillGroup} ${isDark ? styles.pillGroupDark : ""}`}
        >
          {[
            { id: "current", label: "Theme" },
            { id: "light", label: "Light" },
            { id: "dark", label: "Dark" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setBackground(item.id)}
              className={`${styles.pill} ${isDark ? styles.pillDark : ""} ${
                background === item.id
                  ? isDark
                    ? styles.pillActiveDark
                    : styles.pillActive
                  : ""
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty Board Notice */}
      {!hasContent && (
        <p
          className={`${styles.emptyNotice} ${isDark ? styles.emptyNoticeDark : ""}`}
        >
          Draw something on the board to export
        </p>
      )}

      {/* Action Buttons */}
      <div className={styles.actionGroup}>
        <button
          type="button"
          disabled={!hasContent || isDownloading}
          onClick={handleDownload}
          className={`${styles.primaryButton} ${isDark ? styles.primaryButtonDark : ""} ${
            !hasContent ? styles.disabled : ""
          }`}
        >
          <Download size={14} />
          <span>{isDownloading ? "Preparing PNG..." : "Download PNG"}</span>
        </button>

        <button
          type="button"
          disabled={!hasContent}
          onClick={handleCopyToClipboard}
          className={`${styles.secondaryButton} ${isDark ? styles.secondaryButtonDark : ""} ${
            copied
              ? isDark
                ? styles.successButtonDark
                : styles.successButton
              : ""
          } ${!hasContent ? styles.disabled : ""}`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? "Copied to Clipboard!" : "Copy to Clipboard"}</span>
        </button>
      </div>
    </div>
  );
};

export default ExportModal;
