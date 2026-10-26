import { useState, useRef } from "react";
import { renderStroke } from "../utils/draw.js";

const usePen = ({
  canvasRef,
  color,
  size,
  theme,
  pan,
  zoom,
  setElements,
  setUndoStack,
  setRedoStack,
  emitStroke,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPoints = useRef([]);

  const handlePenPointerDown = (worldPoint) => {
    setIsDrawing(true);

    // Set the first point to start a stroke
    currentPoints.current = [worldPoint];
  };

  const handlePenPointerMove = (worldPoint) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Add to the current points
    currentPoints.current.push(worldPoint);

    // Paint the active line (collection of current points)
    const ctx = canvas.getContext("2d");

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    renderStroke(ctx, { points: currentPoints.current, color, size }, theme);

    ctx.restore();
  };

  const handlePenPointerUp = () => {
    setIsDrawing(false);

    // Store the current points
    const pointsToSave = [...currentPoints.current];
    currentPoints.current = [];

    if (pointsToSave.length > 0) {
      const newStroke = {
        id: crypto.randomUUID(),
        type: "stroke",
        points: pointsToSave,
        color,
        size,
      };

      // Add the action to undo stack and clear redo stack
      setUndoStack((prev) => [...prev, { type: "add", stroke: newStroke }]);
      setRedoStack([]);

      // Broadcast the new stroke to peers
      emitStroke(newStroke);

      // Trigger redraw loop to persist stroke on Canvas board
      setElements((prev) => [...prev, newStroke]);
    }
  };

  return {
    isDrawing,
    currentPoints,
    handlePenPointerDown,
    handlePenPointerMove,
    handlePenPointerUp,
  };
};

export default usePen;
