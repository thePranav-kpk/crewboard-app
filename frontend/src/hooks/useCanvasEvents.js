import { useRef } from "react";
import { screenToWorld } from "../utils/coordinates.js";

const SHAPE_TOOLS = ["rectangle", "circle", "arrow", "line"];
const isShapeTool = (t) => SHAPE_TOOLS.includes(t);

const useCanvasEvents = ({
  canvasRef,
  pan,
  zoom,
  tool,
  setTool,
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
    if (tool != "select") return;

    // If double-clicked an existing text element, open it for editing
    const worldPoint = getWorldPoint(e);
    const hitText = handleTextDoubleClick(worldPoint);

    if (hitText) {
      setTool(hitText.type === "note" ? "note" : "text");
      setSelectedIds([]);
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
