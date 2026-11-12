import { useRef } from "react";
import { screenToWorld } from "../utils/coordinates.js";
import { isStrokeHit } from "../utils/hitTest.js";

const SHAPE_TOOLS = ["rectangle", "circle", "arrow", "line"];
const isShapeTool = (t) => SHAPE_TOOLS.includes(t);

const useCanvasEvents = ({
  canvasRef,
  pan,
  zoom,
  tool,
  setTool,
  elements,
  setElements,
  emitDelete,
  textInput,
  handleTextPointerDown,
  handleTextPointerUp,
  handleTextDoubleClick,
  isDismissingText,
  handleSelectionPointerDown,
  handleSelectionPointerMove,
  handleSelectionPointerUp,
  setSelectedIds,
  setSelectionBox,
  handleEraserPointerDown,
  handleEraserPointerMove,
  handleEraserPointerUp,
  startPanning,
  updatePan,
  stopPanning,
  isPanning,
  handlePenPointerDown,
  handlePenPointerMove,
  handlePenPointerUp,
  isDrawing,
  handleShapePointerDown,
  handleShapePointerMove,
  handleShapePointerUp,
  emitCursor,
}) => {
  // Ref to store last timestamp when cursor changed
  const lastCursorEmitRef = useRef(0);

  // Ref to store mouse coordinates
  const mousePosRef = useRef(null);

  // Calculate the world point
  const getWorldPoint = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    // Calculate the coordinates relative to top-left corner of Canvas
    return screenToWorld(
      { x: e.clientX - rect.left, y: e.clientY - rect.top },
      pan,
      zoom,
    );
  };

  // Mouse held down for drawing
  const handlePointerDown = (e) => {
    // Get eraser coordinates
    const worldPoint = getWorldPoint(e);

    // If text input is open, dismiss or switch text box but do not trigger tool actions
    if (textInput) {
      handleTextPointerDown(worldPoint);
      return;
    }

    if (tool === "select") {
      handleSelectionPointerDown(worldPoint);
    }

    if (tool === "eraser") {
      handleEraserPointerDown(worldPoint);
    }

    // Check if mouse middle button (wheel click) pressed for dragging Canvas
    if (tool === "hand" || e.button === 1) {
      startPanning(e.clientX, e.clientY);
    }

    // Only pen can draw
    if (tool === "pen") {
      handlePenPointerDown(worldPoint);
    }

    if (isShapeTool(tool)) {
      handleShapePointerDown(worldPoint);
    }
  };

  // Mouse moving either for drawing or scrolling
  const handlePointerMove = (e) => {
    // Get eraser coordinates
    const worldPoint = getWorldPoint(e);
    mousePosRef.current = worldPoint;

    // Broadcast world-coordinates to peers after 40ms elapse from last cursor movement
    if (Date.now() - lastCursorEmitRef.current > 40) {
      emitCursor(worldPoint.x, worldPoint.y);
      lastCursorEmitRef.current = Date.now();
    }

    if (tool === "select") {
      // Indicates dragging so every point changes its position evenly either for resizing or relocating
      handleSelectionPointerMove(worldPoint, e);
    }

    if (tool === "eraser" && e.buttons === 1) {
      handleEraserPointerMove(worldPoint);
    }

    if (isShapeTool(tool) && e.buttons === 1) {
      handleShapePointerMove(worldPoint);
    }

    if (isPanning) {
      updatePan(e.clientX, e.clientY);
    } else if (isDrawing) {
      handlePenPointerMove(worldPoint);
    }
  };

  // Mouse released (held up)
  const handlePointerUp = (e) => {
    // Get eraser coordinates
    const worldPoint = getWorldPoint(e);

    // If dismissing an active text box, finish dismissal and ignore other tool actions
    if (isDismissingText()) {
      handleTextPointerUp(e, worldPoint);
      return;
    }

    if (tool === "eraser") {
      handleEraserPointerUp();
    }

    if (tool === "select") {
      // Indicates dragging completed
      const worldPoint = getWorldPoint(e);
      handleSelectionPointerUp(worldPoint);
    }

    if (isShapeTool(tool)) {
      handleShapePointerUp(worldPoint);
    }

    if ((tool === "text" || tool === "note") && !isPanning) {
      handleTextPointerUp(e, worldPoint);
    }

    if (isPanning) {
      stopPanning();
    } else if (isDrawing) {
      handlePenPointerUp();
    }
  };

  // Double click to edit any text element
  const handleDoubleClick = (e) => {
    const worldPoint = getWorldPoint(e);

    // Helper to identify accidental 1 or 2 micro-dots created under the cursor by the double-click
    const isClickDot = (el) => {
      if (el.type !== "stroke" || !el.points || el.points.length > 2)
        return false;

      const p = el.points[0];
      return Math.hypot(p.x - worldPoint.x, p.y - worldPoint.y) < 20 / zoom;
    };

    // Helper to clean up the 1 or 2 pen dots created during the double-click
    const pruneRecentClickDots = () => {
      if (tool === "pen") {
        setElements((prev) => {
          const toDelete = [];

          // Only remove the dots at the very tail (The ones created by this double click)
          for (let i = prev.length - 1; i >= 0 && i >= prev.length - 2; i--) {
            if (isClickDot(prev[i])) toDelete.push(prev[i]);
          }

          if (toDelete.length > 0) {
            toDelete.forEach((dot) => emitDelete?.(dot.id));
            return prev.filter((el) => !toDelete.some((d) => d.id === el.id));
          }

          return prev;
        });
      }
    };

    // If double-clicked an existing text element, open it for editing
    const hitText = handleTextDoubleClick(worldPoint);
    if (hitText) {
      pruneRecentClickDots();
      setTool(hitText.type === "note" ? "note" : "text");
      setSelectedIds([]);
      setSelectionBox(null);
      return;
    }

    // Hit test any other canvas stroke or shape from top to bottom
    const pad = 8 / zoom;

    // Select elements other than 2 dots rendered due to double click on Pen
    const realElements = (elements || []).filter((el) => !isClickDot(el));
    const hitElement = [...realElements]
      .reverse()
      .find((el) => isStrokeHit(el, worldPoint, pad));

    if (hitElement) {
      // Clean up accidental micro-dot if pen was active during the double-click
      pruneRecentClickDots();

      // Switch to Magic Pen (select) tool and select the element for immediate moving or resizing
      setTool("select");
      setSelectedIds([hitElement.id]);
      setSelectionBox(null);
    }
  };

  return {
    getWorldPoint,
    mousePosRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleDoubleClick,
  };
};

export default useCanvasEvents;
