import { useRef } from "react";
import { isStrokeHit } from "../utils/hitTest.js";

const useEraser = ({
  elements,
  setElements,
  setUndoStack,
  setRedoStack,
  emitDelete,
}) => {
  // Ref to all strokes erased in one gesture (swipe)
  const erasedInCurrentGestureRef = useRef([]);

  // To erase stroke
  const eraseStrokeAt = (worldPoint) => {
    // Find the first stroke that intersects the eraser cursor
    const hitStroke = elements.find((stroke) =>
      isStrokeHit(stroke, worldPoint),
    );

    if (hitStroke) {
      // Add to array storing current erased strokes in one gesture
      if (
        !erasedInCurrentGestureRef.current.some(
          (stroke) => stroke.id === hitStroke.id,
        )
      )
        erasedInCurrentGestureRef.current.push(hitStroke);

      // Delete the stroke from canvas state
      emitDelete(hitStroke.id);
      setElements((prev) =>
        prev.filter((stroke) => stroke.id !== hitStroke.id),
      );
    }
  };

  const handleEraserPointerDown = (worldPoint) => {
    // Collect all strokes erased in this gesture
    erasedInCurrentGestureRef.current = [];
    eraseStrokeAt(worldPoint);
  };

  const handleEraserPointerMove = (worldPoint) => {
    eraseStrokeAt(worldPoint);
  };

  const handleEraserPointerUp = () => {
    if (erasedInCurrentGestureRef.current.length > 0) {
      const strokesToSave = [...erasedInCurrentGestureRef.current];

      // Add the action to undo stack and clear redo stack
      setUndoStack((prev) => [
        ...prev,
        { type: "erase", strokes: strokesToSave },
      ]);
      setRedoStack([]);

      // Reset to collect new strokes erased in next gesture
      erasedInCurrentGestureRef.current = [];
    }
  };

  return {
    handleEraserPointerDown,
    handleEraserPointerMove,
    handleEraserPointerUp,
  };
};

export default useEraser;
