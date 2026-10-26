/* eslint-disable no-unused-vars */
import { useRef, useState, useEffect } from "react";
import usePanZoom from "../hooks/usePanZoom.js";
import { screenToWorld } from "../utils/coordinates.js";
import useSocket from "../hooks/useSocket.js";
import useHistory from "../hooks/useHistory.js";
import useSelection from "../hooks/useSelection.js";
import useCanvasRender from "../hooks/useCanvasRender.js";
import usePen from "../hooks/usePen.js";
import useEraser from "../hooks/useEraser.js";
import Toolbar from "./Toolbar.jsx";
import PeerCursors from "./PeerCursors.jsx";
import ZoomControls from "./ZoomControls.jsx";
import Header from "./Header.jsx";
import styles from "./Whiteboard.module.css";

const Whiteboard = () => {
  // Reference to Canvas DOM element
  const canvasRef = useRef(null);

  // Ref to store last timestamp when cursor changed
  const lastCursorEmitRef = useRef(0);

  // Array of all finished strokes
  const [elements, setElements] = useState([]);
  const elementsRef = useRef(elements);

  // Store all current drawing options
  // Lazy initial state
  const [tool, setTool] = useState(() => {
    const savedTool = localStorage.getItem("tool");
    return savedTool ? savedTool : "pen";
  });

  const [color, setColor] = useState(() => {
    const savedColor = localStorage.getItem("color");
    return savedColor ? savedColor : "#1e1e1e";
  });

  const [size, setSize] = useState(() => {
    const savedSize = localStorage.getItem("size");
    return savedSize ? parseInt(savedSize) : 4;
  });

  // Lazy initial state
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? savedTheme : "light";
  });

  const {
    pan,
    zoom,
    isPanning,
    handleWheel,
    startPanning,
    updatePan,
    stopPanning,
    resetView,
    zoomIn,
    zoomOut,
  } = usePanZoom();

  const {
    isConnected,
    peers,
    peerCursors,
    emitStroke,
    emitCursor,
    emitDelete,
    emitUpdate,
  } = useSocket({
    roomId: "general", // Room id
    onStrokeReceived: (stroke) => {
      // Add remote stroke to your board
      setElements((prev) => [...prev, stroke]);
    },
    onInitialElements: (savedElements) => {
      // Load existing drawings when joining a room
      if (savedElements && savedElements.length > 0) {
        setElements(savedElements);
      }
    },
    onStrokeDeleted: (elementId) => {
      if (elementId) {
        setElements((prev) => prev.filter((e) => e.id !== elementId));
      }
    },
    onElementsUpdated: (updatedElements) => {
      if (updatedElements) {
        setElements((prev) =>
          prev.map((element) => {
            const newElement = updatedElements.find(
              (el) => el.id === element.id,
            );
            return newElement ? newElement : element;
          }),
        );
      }
    },
  });

  const {
    undoStack,
    redoStack,
    setUndoStack,
    setRedoStack,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
  } = useHistory({
    elementsRef,
    setElements,
    emitStroke,
    emitDelete,
    emitUpdate,
  });

  const {
    selectedIds,
    setSelectedIds,
    selectionBox,
    setSelectionBox,
    handleSelectionPointerDown,
    handleSelectionPointerMove,
    handleSelectionPointerUp,
  } = useSelection({
    elements,
    setElements,
    zoom,
    emitUpdate,
    setUndoStack,
    setRedoStack,
  });

  const {
    isDrawing,
    currentPoints,
    handlePenPointerDown,
    handlePenPointerMove,
    handlePenPointerUp,
  } = usePen({
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
  });

  const {
    handleEraserPointerDown,
    handleEraserPointerMove,
    handleEraserPointerUp,
  } = useEraser({
    elements,
    setElements,
    setUndoStack,
    setRedoStack,
    emitDelete,
  });

  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  // Store theme in localStorage
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Store tool, color and size in localStorage
  useEffect(() => {
    localStorage.setItem("tool", tool);
    localStorage.setItem("color", color);
    localStorage.setItem("size", size.toString());
  }, [tool, color, size]);

  // Zooming, sizing and redrawing loop
  useCanvasRender({
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
  });

  const handleToggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (color === "#ffffff" && nextTheme === "light") setColor("#1e1e1e");
    if (color === "#1e1e1e" && nextTheme === "dark") setColor("#ffffff");
  };

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
  };

  // Mouse moving either for drawing or scrolling
  const handlePointerMove = (e) => {
    // Get eraser coordinates
    const worldPoint = getWorldPoint(e);

    // Broadcast world-coordinates to peers after 40ms elapse from last cursor movement
    if (Date.now() - lastCursorEmitRef.current > 40) {
      emitCursor(worldPoint.x, worldPoint.y);
      lastCursorEmitRef.current = Date.now();
    }

    if (tool === "select" && e.buttons === 1) {
      // Indicates dragging so every point changes its position evenly
      handleSelectionPointerMove(worldPoint);
    }

    if (tool === "eraser" && e.buttons === 1) {
      handleEraserPointerMove(worldPoint);
    }

    if (isPanning) {
      updatePan(e.clientX, e.clientY);
    } else if (isDrawing) {
      handlePenPointerMove(worldPoint);
    }
  };

  // Mouse released (held up)
  const handlePointerUp = (e) => {
    if (tool === "eraser") {
      handleEraserPointerUp();
    }

    if (tool === "select") {
      // Indicates dragging completed
      const worldPoint = getWorldPoint(e);
      handleSelectionPointerUp(worldPoint);
    }

    if (isPanning) {
      stopPanning();
    } else if (isDrawing) {
      handlePenPointerUp();
    }
  };

  return (
    <div
      className={`${styles.container} ${theme === "dark" ? styles.darkContainer : ""}`}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`${styles.canvas} ${tool === "hand" ? styles.cursorGrab : styles.cursorCrosshair}`}
      />

      {/* Render the header */}
      <Header
        roomId={"general"}
        theme={theme}
        handleToggleTheme={handleToggleTheme}
        elements={elements}
      />

      {/* Render peer cursors */}
      <PeerCursors peerCursors={peerCursors} pan={pan} zoom={zoom} />

      {/* Render the toolbar */}
      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        size={size}
        setSize={setSize}
        theme={theme}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Render the zoom controls */}
      <ZoomControls
        zoom={zoom}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        resetView={resetView}
        theme={theme}
      />
    </div>
  );
};

export default Whiteboard;
