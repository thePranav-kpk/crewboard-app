import { Minus, Plus } from "lucide-react";
import styles from "./ZoomControls.module.css";

const ZoomControls = ({ zoom, zoomIn, zoomOut, resetView }) => {
  const percentage = Math.round((zoom || 1) * 100);

  return (
    <div className={styles.zoomContainer}>
      <button
        type="button"
        className={styles.zoomButton}
        onClick={zoomOut}
        title="Zoom Out"
        aria-label="Zoom out"
      >
        <Minus size={14} strokeWidth={2.5} />
      </button>

      <button
        type="button"
        className={styles.zoomPercent}
        onClick={resetView}
        title="Reset zoom to 100%"
        aria-label="Reset zoom to 100%"
      >
        {percentage}%
      </button>

      <button
        type="button"
        className={styles.zoomButton}
        onClick={zoomIn}
        title="Zoom In"
        aria-label="Zoom in"
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default ZoomControls;
