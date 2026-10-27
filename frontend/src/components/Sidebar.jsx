import { Square, Circle, Minus, ArrowUpRight, Type } from "lucide-react";
import styles from "./Sidebar.module.css";

const SHAPES = [
  { id: "rectangle", label: "Rectangle", icon: Square },
  { id: "circle", label: "Circle", icon: Circle },
  { id: "line", label: "Line", icon: Minus },
  { id: "arrow", label: "Arrow", icon: ArrowUpRight },
  { id: "text", label: "Text", icon: Type },
];

const Sidebar = ({ tool, setTool, theme }) => {
  const isDark = theme === "dark";

  return (
    <aside
      className={`${styles.sidebar} ${isDark ? styles.sidebarDark : ""}`}
      aria-label="Shapes toolbar"
    >
      {SHAPES.map((s) => {
        const Icon = s.icon;
        const isActive = tool === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => setTool(s.id)}
            title={s.label}
            aria-label={s.label}
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
    </aside>
  );
};

export default Sidebar;
