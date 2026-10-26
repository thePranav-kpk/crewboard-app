/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import { renderStroke } from "../utils/draw.js";
import { getGroupBounds } from "../utils/hitTest.js";

const useCanvasRender = ({
  canvasRef,
  elements,
  pan,
  zoom,
  theme,
  selectedIds,
  selectionBox,
  isDrawing,
  currentPoints,
  color,
  size,
  handleWheel,
}) => {
  // Zoom only the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // passive: false prevents toolbar and other components from zooming when canvas is zoomed
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Size the Canvas to Window
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;

    const handleResize = () => {
      canvas.height = window.innerHeight;
      canvas.width = window.innerWidth;
    };

    // Listen for browser window resizing
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Canvas redraw loop when elements change or when zoomed in,out or panned in,out
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Clear the screen to paint fresh
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Redraw all the elements
    // Pass theme to switch the stroke colors if same theme and similar color
    elements.forEach((stroke) => renderStroke(ctx, stroke, theme));

    // Draw highlighted box around selected strokes
    if (selectedIds.length > 0) {
      const selectedStrokes = elements.filter((s) =>
        selectedIds.includes(s.id),
      );
      const bounds = getGroupBounds(selectedStrokes);

      if (bounds) {
        ctx.save();
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 1.5 / zoom;
        ctx.setLineDash([4 / zoom, 4 / zoom]);

        const pad = 6 / zoom;
        ctx.strokeRect(
          bounds.minX - pad,
          bounds.minY - pad,
          bounds.width + pad * 2,
          bounds.height + pad * 2,
        );

        ctx.restore();
      }
    }

    // Draw active selection box (while dragging)
    if (selectionBox) {
      const { start, current } = selectionBox;

      const x = Math.min(start.x, current.x);
      const y = Math.min(start.y, current.y);
      const w = Math.abs(current.x - start.x);
      const h = Math.abs(current.y - start.y);

      ctx.save();

      ctx.strokeStyle = "#3b82f6";
      ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);

      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);

      ctx.restore();
    }

    if (isDrawing && currentPoints.current.length > 0) {
      renderStroke(
        ctx,
        {
          points: currentPoints.current,
          color,
          size,
        },
        theme,
      );
    }

    ctx.restore();
  }, [elements, pan, zoom, isDrawing, selectedIds, selectionBox, theme]);
};

export default useCanvasRender;
