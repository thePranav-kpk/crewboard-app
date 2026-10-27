import { Pencil, Eraser, Wand2, Hand, Undo2, Redo2 } from "lucide-react";
import styles from "./Toolbar.module.css";

const COLORS = [
  { name: "Charcoal", hex: "#1e1e1e" },
  { name: "White", hex: "#ffffff" },
  { name: "Red", hex: "#ef4444" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Green", hex: "#10b981" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Purple", hex: "#8b5cf6" },
];

const SIZES = [
  { label: "0.5x", value: 2, dotSize: 4 },
  { label: "1x", value: 4, dotSize: 7 },
  { label: "2x", value: 8, dotSize: 11 },
];

const TOOLS = [
  { id: "pen", label: "Pen", icon: Pencil },
  { id: "eraser", label: "Eraser", icon: Eraser },
  { id: "select", label: "Magic Pen", icon: Wand2 },
  { id: "hand", label: "Hand", icon: Hand },
];

const Divider = ({ isDark }) => (
  <div className={`${styles.divider} ${isDark ? styles.dividerDark : ""}`} />
);

const Toolbar = ({
  tool,
  setTool,
  color,
  setColor,
  size,
  setSize,
  theme,
  handleUndo,
  handleRedo,
  canUndo,
  canRedo,
}) => {
  const isDark = theme === "dark";
  const isColorDisabled = !["pen", "rectangle", "circle", "line", "arrow", "text"].includes(tool);
  const isSizeDisabled = !["pen", "rectangle", "circle", "line", "arrow"].includes(tool);

  return (
    <div className={`${styles.toolbar} ${isDark ? styles.toolbarDark : ""}`}>
      {/* 1. Tools Section */}
      <div className={styles.toolSection}>
        {TOOLS.map((t) => {
          const Icon = t.icon;
          const isActive = tool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={t.label}
              className={`${styles.toolButton} ${isDark ? styles.toolButtonDark : ""} ${
                isActive
                  ? isDark
                    ? styles.toolButtonActiveDark
                    : styles.toolButtonActive
                  : ""
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            </button>
          );
        })}
      </div>

      <Divider isDark={isDark} />

      {/* Undo and Redo */}
      <div className={styles.toolSection}>
        <button
          type="button"
          disabled={!canUndo}
          onClick={handleUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
          className={`${styles.toolButton} ${isDark ? styles.toolButtonDark : ""}`}
        >
          <Undo2 size={18} strokeWidth={2} />
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={handleRedo}
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
          className={`${styles.toolButton} ${isDark ? styles.toolButtonDark : ""}`}
        >
          <Redo2 size={18} strokeWidth={2} />
        </button>
      </div>

      <Divider isDark={isDark} />

      {/* 2. Color Palette Section */}
      <div
        className={`${styles.colorSection} ${isColorDisabled ? styles.disabledSection : ""}`}
      >
        {COLORS.map((c) => {
          // Skip the color matching the theme
          if (
            (c.name === "Charcoal" && theme === "dark") ||
            (c.name === "White" && theme === "light")
          )
            return null;
          const isSelected = color === c.hex && !isColorDisabled;
          return (
            <button
              key={c.hex}
              onClick={() => setColor(c.hex)}
              title={c.name}
              className={`${styles.colorSwatch} ${isDark ? styles.colorSwatchDark : ""} ${
                isSelected ? styles.colorSwatchActive : ""
              }`}
              style={{
                backgroundColor: c.hex,
                outline: isSelected ? `2px solid ${c.hex}` : "none",
                outlineOffset: isSelected ? "2px" : "0px",
              }}
            />
          );
        })}
      </div>

      <Divider isDark={isDark} />

      {/* 3. Stroke Thickness Section */}
      <div
        className={`${styles.sizeSection} ${isSizeDisabled ? styles.disabledSection : ""}`}
      >
        {SIZES.map((s) => {
          const isSelected = size === s.value && !isSizeDisabled;
          return (
            <button
              key={s.label}
              onClick={() => setSize(s.value)}
              title={`${s.label} (${s.value}px)`}
              className={`${styles.sizeButton} ${isDark ? styles.sizeButtonDark : ""} ${
                isSelected
                  ? isDark
                    ? styles.sizeButtonActiveDark
                    : styles.sizeButtonActive
                  : ""
              }`}
            >
              {/* Dot thickness indicator */}
              <div
                className={styles.sizeDot}
                style={{
                  width: s.dotSize,
                  height: s.dotSize,
                  backgroundColor: isSelected
                    ? color
                    : isDark
                      ? "#71717a"
                      : "#9ca3af",
                }}
              />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Toolbar;
