import { useState, useRef } from "react";
import { getGroupBounds, isStrokeInBox } from "../utils/hitTest.js";

const useSelection = ({
  elements,
  setElements,
  zoom,
  emitUpdate,
  setUndoStack,
  setRedoStack,
}) => {
  // Store ids for selecting box
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectionBox, setSelectionBox] = useState(null);

  // Ref to check if dragging selected strokes
  const isDraggingSelectionRef = useRef(null);

  // Ref to store last dragged position
  const dragLastPosRef = useRef(null);

  // Ref to store position where dragging began
  const dragFirstPosRef = useRef(null);

  const handleSelectionPointerDown = (worldPoint) => {
    const selectedStrokes = elements.filter((el) =>
      selectedIds.includes(el.id),
    );
    const bounds = getGroupBounds(selectedStrokes);
    const pad = 6 / zoom;

    const isHitOnSelected =
      bounds &&
      worldPoint.x >= bounds.minX - pad &&
      worldPoint.x <= bounds.maxX + pad &&
      worldPoint.y >= bounds.minY - pad &&
      worldPoint.y <= bounds.maxY + pad;

    // Indicates dragging if hit on selected stroke
    if (isHitOnSelected) {
      isDraggingSelectionRef.current = true;
      dragFirstPosRef.current = worldPoint;
      dragLastPosRef.current = worldPoint;
    } else {
      // Indicates mouse pressed outside selected region, so remove the selected ids and start new selection
      setSelectedIds([]);
      setSelectionBox({ start: worldPoint, current: worldPoint });
    }
  };

  const handleSelectionPointerMove = (worldPoint) => {
    if (isDraggingSelectionRef.current) {
      // Physical and vertical distance
      const deltaX = worldPoint.x - dragLastPosRef.current.x;
      const deltaY = worldPoint.y - dragLastPosRef.current.y;

      setElements((prev) =>
        prev.map((stroke) => {
          if (stroke.type === "stroke" || !stroke.type) {
            if (selectedIds.includes(stroke.id)) {
              return {
                ...stroke,
                points: stroke.points.map((point) => ({
                  x: point.x + deltaX,
                  y: point.y + deltaY,
                })),
              };
            }
          } else if (stroke.type === "rectangle") {
            if (selectedIds.includes(stroke.id)) {
              return { ...stroke, x: stroke.x + deltaX, y: stroke.y + deltaY };
            }
          } else if (stroke.type === "circle") {
            if (selectedIds.includes(stroke.id)) {
              return {
                ...stroke,
                centerX: stroke.centerX + deltaX,
                centerY: stroke.centerY + deltaY,
              };
            }
          }
          return stroke;
        }),
      );

      dragLastPosRef.current = worldPoint;
    } else {
      // Indicates selecting box
      setSelectionBox((prev) =>
        prev ? { ...prev, current: worldPoint } : null,
      );
    }
  };

  const handleSelectionPointerUp = (worldPoint) => {
    if (isDraggingSelectionRef.current) {
      // Calculate displacement
      const dx = worldPoint.x - dragFirstPosRef.current.x;
      const dy = worldPoint.y - dragFirstPosRef.current.y;

      // Add the action to undo stack
      if (Math.hypot(dx, dy) > 1) {
        setUndoStack((prev) => [
          ...prev,
          {
            type: "move",
            strokeIds: [...selectedIds],
            dx,
            dy,
          },
        ]);
        setRedoStack([]);
      }

      isDraggingSelectionRef.current = false;
      dragLastPosRef.current = null;
      dragFirstPosRef.current = null;

      const updatedElements = elements.filter((stroke) =>
        selectedIds.includes(stroke.id),
      );
      emitUpdate(updatedElements);
    } else {
      // Indicates selection completed
      if (selectionBox) {
        // Find strokes intersecting the selection box
        const strokes = elements.filter((stroke) =>
          isStrokeInBox(stroke, selectionBox.start, selectionBox.current),
        );

        // Store selected ids
        const ids = strokes.map((stroke) => stroke.id);
        setSelectedIds(ids);

        // Remove selection box
        setSelectionBox(null);
      }
    }
  };

  return {
    selectedIds,
    setSelectedIds,
    selectionBox,
    setSelectionBox,
    handleSelectionPointerDown,
    handleSelectionPointerMove,
    handleSelectionPointerUp,
  };
};

export default useSelection;
