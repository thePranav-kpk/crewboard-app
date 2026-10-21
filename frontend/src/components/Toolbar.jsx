import { Pencil, Eraser, Wand2, Hand } from "lucide-react";
import styles from "./Toolbar.module.css";

const COLORS = [
  { name: "Charcoal", hex: "#1e1e1e" },
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

const Divider = () => <div className={styles.divider} />;

const Toolbar = ({ tool, setTool, color, setColor, size, setSize }) => {
  const isColorDisabled = tool === "eraser" || tool === "hand";
  const isSizeDisabled = tool === "hand";

  return (
    <div className={styles.toolbar}>
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
              className={`${styles.toolButton} ${isActive ? styles.toolButtonActive : ""}`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            </button>
          );
        })}
      </div>

      <Divider />

      {/* 2. Color Palette Section */}
      <div
        className={`${styles.colorSection} ${isColorDisabled ? styles.disabledSection : ""}`}
      >
        {COLORS.map((c) => {
          const isSelected = color === c.hex;
          return (
            <button
              key={c.hex}
              onClick={() => setColor(c.hex)}
              title={c.name}
              className={`${styles.colorSwatch} ${isSelected ? styles.colorSwatchActive : ""}`}
              style={{
                backgroundColor: c.hex,
                outline: isSelected ? `2px solid ${c.hex}` : "none",
                outlineOffset: isSelected ? "2px" : "0px",
              }}
            />
          );
        })}
      </div>

      <Divider />

      {/* 3. Stroke Thickness Section */}
      <div
        className={`${styles.sizeSection} ${isSizeDisabled ? styles.disabledSection : ""}`}
      >
        {SIZES.map((s) => {
          const isSelected = size === s.value;
          return (
            <button
              key={s.label}
              onClick={() => setSize(s.value)}
              title={`${s.label} (${s.value}px)`}
              className={`${styles.sizeButton} ${isSelected ? styles.sizeButtonActive : ""}`}
            >
              {/* Dot thickness indicator */}
              <div
                className={styles.sizeDot}
                style={{
                  width: s.dotSize,
                  height: s.dotSize,
                  backgroundColor: isSelected ? color : "#9ca3af",
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
