import { useState, useRef } from "react";
import {
  getGroupBounds,
  getHitHandle,
  isStrokeInBox,
} from "../utils/hitTest.js";
import { moveStroke, resizeElements } from "../utils/coordinates.js";

const useSelection = ({
  elements,
  setElements,
  zoom,
  emitUpdate,
  setUndoStack,
  setRedoStack,
  canvasRef,
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

  // Ref to store handle (corner) from where resizing began
  const activeHandleRef = useRef(null);

  // Ref to store actual bounds before dragging began
  const actualBoundsRef = useRef(null);

  // Ref to store actual elements before dragging began
  const actualElements = useRef([]);

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

    const hitHandle = getHitHandle(worldPoint, bounds, zoom);

    // Hit handle indicates resizing the elements
    if (hitHandle) {
      // Update Refs
      activeHandleRef.current = hitHandle;
      actualBoundsRef.current = bounds;
      actualElements.current = structuredClone(selectedStrokes);

      return;
    }

    // Else indicates dragging if hit on selected stroke
    if (isHitOnSelected) {
      isDraggingSelectionRef.current = true;
      dragFirstPosRef.current = worldPoint;
      dragLastPosRef.current = worldPoint;
    } else {
      // Indicates mouse pressed outside selected region, so remove the selected ids and start new selection
      setSelectedIds([]);
      if (canvasRef?.current) {
        canvasRef.current.style.cursor = "";
      }
      setSelectionBox({ start: worldPoint, current: worldPoint });
    }
  };

  const handleSelectionPointerMove = (worldPoint, e) => {
    // Indicates resizing
    if (activeHandleRef.current) {
      const actualBounds = actualBoundsRef.current;
      const handle = activeHandleRef.current;

      const isSingleLineOrArrow =
        actualElements.current.length === 1 &&
        (actualElements.current[0].type === "line" ||
          actualElements.current[0].type === "arrow");

      // For line and arrow, stretch strictly along its line vector to preserve angle and prevent slanting
      if (isSingleLineOrArrow) {
        const el = actualElements.current[0];
        const p1 = { x: el.startX, y: el.startY };
        const p2 = { x: el.endX, y: el.endY };
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.hypot(dx, dy);

        if (length > 0) {
          const ux = dx / length;
          const uy = dy / length;

          const handlePositions = {
            tl: { x: actualBounds.minX, y: actualBounds.minY },
            tr: { x: actualBounds.maxX, y: actualBounds.minY },
            br: { x: actualBounds.maxX, y: actualBounds.maxY },
            bl: { x: actualBounds.minX, y: actualBounds.maxY },
          };
          const handlePos = handlePositions[handle] || {
            x: worldPoint.x,
            y: worldPoint.y,
          };

          const dist1 = Math.hypot(handlePos.x - p1.x, handlePos.y - p1.y);
          const dist2 = Math.hypot(handlePos.x - p2.x, handlePos.y - p2.y);

          let updatedElement;

          if (dist2 < dist1) {
            // p1 is fixed anchor, p2 extends along (ux, uy)
            const proj =
              (worldPoint.x - p1.x) * ux + (worldPoint.y - p1.y) * uy;
            const newLength = Math.max(10, proj);
            updatedElement = {
              ...el,
              startX: p1.x,
              startY: p1.y,
              endX: p1.x + ux * newLength,
              endY: p1.y + uy * newLength,
            };
          } else {
            // p2 is fixed anchor, p1 extends along (-ux, -uy)
            const proj =
              (worldPoint.x - p2.x) * -ux + (worldPoint.y - p2.y) * -uy;
            const newLength = Math.max(10, proj);
            updatedElement = {
              ...el,
              startX: p2.x - ux * newLength,
              startY: p2.y - uy * newLength,
              endX: p2.x,
              endY: p2.y,
            };
          }

          setElements((prev) =>
            prev.map((item) => (item.id === el.id ? updatedElement : item)),
          );
          return;
        }
      }

      const actualWidth = actualBounds.maxX - actualBounds.minX;
      const actualHeight = actualBounds.maxY - actualBounds.minY;

      if (actualWidth === 0 && actualHeight === 0) return;

      const isSingleAspectLocked =
        actualElements.current.length === 1 &&
        (actualElements.current[0].type === "text" ||
          actualElements.current[0].type === "circle");

      const lockAspectRatio = isSingleAspectLocked || e?.shiftKey;

      let newBounds = {};

      if (lockAspectRatio) {
        let rawW = 0;
        let rawH = 0;

        if (handle === "br") {
          rawW = worldPoint.x - actualBounds.minX;
          rawH = worldPoint.y - actualBounds.minY;
        } else if (handle === "tl") {
          rawW = actualBounds.maxX - worldPoint.x;
          rawH = actualBounds.maxY - worldPoint.y;
        } else if (handle === "tr") {
          rawW = worldPoint.x - actualBounds.minX;
          rawH = actualBounds.maxY - worldPoint.y;
        } else if (handle === "bl") {
          rawW = actualBounds.maxX - worldPoint.x;
          rawH = worldPoint.y - actualBounds.minY;
        }

        const scaleX = rawW / actualWidth;
        const scaleY = rawH / actualHeight;
        // Pick dominant axis movement to scale uniformly
        const scale = Math.max(
          0.1,
          Math.abs(scaleX - 1) > Math.abs(scaleY - 1) ? scaleX : scaleY,
        );

        const newW = actualWidth * scale;
        const newH = actualHeight * scale;

        if (handle === "br") {
          newBounds = {
            minX: actualBounds.minX,
            minY: actualBounds.minY,
            maxX: actualBounds.minX + newW,
            maxY: actualBounds.minY + newH,
          };
        } else if (handle === "tl") {
          newBounds = {
            minX: actualBounds.maxX - newW,
            minY: actualBounds.maxY - newH,
            maxX: actualBounds.maxX,
            maxY: actualBounds.maxY,
          };
        } else if (handle === "tr") {
          newBounds = {
            minX: actualBounds.minX,
            minY: actualBounds.maxY - newH,
            maxX: actualBounds.minX + newW,
            maxY: actualBounds.maxY,
          };
        } else if (handle === "bl") {
          newBounds = {
            minX: actualBounds.maxX - newW,
            minY: actualBounds.minY,
            maxX: actualBounds.maxX,
            maxY: actualBounds.minY + newH,
          };
        }
      } else {
        // Top-Left -> (minX,minY)
        // Top-Right -> (maxX,minY)
        // Bottom-Right -> (maxX,maxY)
        // Bottom-Left -> (minX,maxY)

        // If hit handle is top-left then bottom-right will stay fixed (Opposite corner is fixed)
        // minX, minY changes
        if (handle === "tl") {
          newBounds = {
            minX: worldPoint.x,
            minY: worldPoint.y,
            maxX: actualBounds.maxX,
            maxY: actualBounds.maxY,
          };
        }
        // maxX, minY changes
        else if (handle === "tr") {
          newBounds = {
            minX: actualBounds.minX,
            minY: worldPoint.y,
            maxX: worldPoint.x,
            maxY: actualBounds.maxY,
          };
        }
        // maxX, maxY changes
        else if (handle === "br") {
          newBounds = {
            minX: actualBounds.minX,
            minY: actualBounds.minY,
            maxX: worldPoint.x,
            maxY: worldPoint.y,
          };
        }
        // minX, maxY changes
        else if (handle === "bl") {
          newBounds = {
            minX: worldPoint.x,
            minY: actualBounds.minY,
            maxX: actualBounds.maxX,
            maxY: worldPoint.y,
          };
        }
      }

      // If left crossed right or top crossed bottom
      newBounds = {
        minX: Math.min(newBounds.minX, newBounds.maxX),
        minY: Math.min(newBounds.minY, newBounds.maxY),
        maxX: Math.max(newBounds.minX, newBounds.maxX),
        maxY: Math.max(newBounds.minY, newBounds.maxY),
      };

      // Get the resized elements
      const resizedElements = resizeElements(
        actualElements.current,
        actualBounds,
        newBounds,
      );

      // Update elements to resized elements
      setElements((prev) =>
        prev.map((element) => {
          const updated = resizedElements.find((el) => el.id === element.id);
          return updated || element;
        }),
      );

      return;
    }

    // Indicates dragging
    if (isDraggingSelectionRef.current) {
      // Physical and vertical distance
      const deltaX = worldPoint.x - dragLastPosRef.current.x;
      const deltaY = worldPoint.y - dragLastPosRef.current.y;

      setElements((prev) =>
        prev.map((stroke) =>
          selectedIds.includes(stroke.id)
            ? moveStroke(stroke, deltaX, deltaY)
            : stroke,
        ),
      );

      dragLastPosRef.current = worldPoint;
      return;
    }

    // Indicates dragging on empty space
    if (selectionBox) {
      setSelectionBox((prev) =>
        prev ? { ...prev, current: worldPoint } : null,
      );
      return;
    }

    // Cursor update on hovering over selection box or handles
    if (canvasRef?.current) {
      if (selectedIds.length > 0) {
        const selectedStrokes = elements.filter((el) =>
          selectedIds.includes(el.id),
        );

        const bounds = getGroupBounds(selectedStrokes);
        const handle = getHitHandle(worldPoint, bounds, zoom);

        if (handle === "tl" || handle === "br") {
          canvasRef.current.style.cursor = "nwse-resize";
        } else if (handle === "tr" || handle === "bl") {
          canvasRef.current.style.cursor = "nesw-resize";
        } else if (
          bounds &&
          worldPoint.x >= bounds.minX - 6 / zoom &&
          worldPoint.x <= bounds.maxX + 6 / zoom &&
          worldPoint.y >= bounds.minY - 6 / zoom &&
          worldPoint.y <= bounds.maxY + 6 / zoom
        ) {
          canvasRef.current.style.cursor = "move";
        } else {
          canvasRef.current.style.cursor = "";
        }
      } else {
        canvasRef.current.style.cursor = "";
      }
    }
  };

  const handleSelectionPointerUp = (worldPoint) => {
    if (activeHandleRef.current) {
      const prevElements = actualElements.current;
      const updatedElements = elements.filter((stroke) =>
        selectedIds.includes(stroke.id),
      );

      if (prevElements.length > 0) {
        // Add the action to undo stack
        setUndoStack((prev) => [
          ...prev,
          {
            type: "batch_resize",
            previous: prevElements,
            current: updatedElements,
          },
        ]);
        setRedoStack([]);
      }

      activeHandleRef.current = null;
      actualBoundsRef.current = null;
      actualElements.current = [];

      emitUpdate(updatedElements);
      return;
    }

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
