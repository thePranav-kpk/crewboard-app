import { Pencil, Eraser, Wand2, Hand } from "lucide-react";

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

const Divider = () => (
  <div style={{ width: 1, height: 26, backgroundColor: "#e5e7eb", margin: "0 4px" }} />
);

const Toolbar = ({ tool, setTool, color, setColor, size, setSize }) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: 8,
        backgroundColor: "rgba(255, 255, 255, 0.94)",
        backdropFilter: "blur(12px)",
        padding: "8px 14px",
        borderRadius: "18px",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        boxShadow: "0 10px 28px -4px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        userSelect: "none",
      }}
    >
      {/* 1. Tools Section */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {TOOLS.map((t) => {
          const Icon = t.icon;
          const isActive = tool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={t.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 38,
                height: 38,
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                backgroundColor: isActive ? "#1e1e1e" : "transparent",
                color: isActive ? "#ffffff" : "#4b5563",
                boxShadow: isActive ? "0 2px 6px rgba(0, 0, 0, 0.2)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            </button>
          );
        })}
      </div>

      <Divider />

      {/* 2. Color Palette Section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          opacity: tool === "eraser" || tool === "hand" ? 0.4 : 1,
          pointerEvents: tool === "eraser" || tool === "hand" ? "none" : "auto",
          transition: "opacity 0.2s ease",
        }}
      >
        {COLORS.map((c) => {
          const isSelected = color === c.hex;
          return (
            <button
              key={c.hex}
              onClick={() => setColor(c.hex)}
              title={c.name}
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                backgroundColor: c.hex,
                border: "2px solid #ffffff",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                outline: isSelected ? `2px solid ${c.hex}` : "none",
                outlineOffset: isSelected ? "2px" : "0px",
                transform: isSelected ? "scale(1.15)" : "scale(1)",
                transition: "transform 0.15s ease, outline 0.15s ease",
              }}
            />
          );
        })}
      </div>

      <Divider />

      {/* 3. Stroke Thickness Section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          opacity: tool === "hand" ? 0.4 : 1,
          pointerEvents: tool === "hand" ? "none" : "auto",
          transition: "opacity 0.2s ease",
        }}
      >
        {SIZES.map((s) => {
          const isSelected = size === s.value;
          return (
            <button
              key={s.label}
              onClick={() => setSize(s.value)}
              title={`${s.label} (${s.value}px)`}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: "6px 8px",
                minWidth: 34,
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                backgroundColor: isSelected ? "#f3f4f6" : "transparent",
                color: isSelected ? "#111827" : "#6b7280",
                fontWeight: isSelected ? 600 : 500,
                fontSize: "11px",
                transition: "all 0.15s ease",
              }}
            >
              {/* Dot thickness indicator */}
              <div
                style={{
                  width: s.dotSize,
                  height: s.dotSize,
                  borderRadius: "50%",
                  backgroundColor: isSelected ? color : "#9ca3af",
                  transition: "background-color 0.15s ease",
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
