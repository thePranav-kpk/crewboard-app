/* eslint-disable no-unused-vars */
import { useRef, useState, useEffect } from "react";

import usePanZoom from "../hooks/usePanZoom.js";
import useSocket from "../hooks/useSocket.js";
import useHistory from "../hooks/useHistory.js";
import useSelection from "../hooks/useSelection.js";
import useCanvasRender from "../hooks/useCanvasRender.js";
import usePen from "../hooks/usePen.js";
import useEraser from "../hooks/useEraser.js";
import useShape from "../hooks/useShape.js";
import useText from "../hooks/useText.js";
import useCanvasEvents from "../hooks/useCanvasEvents.js";
import useClipboard from "../hooks/useClipboard.js";

import Toolbar from "./Toolbar.jsx";
import PeerCursors from "./PeerCursors.jsx";
import ZoomControls from "./ZoomControls.jsx";
import Header from "./Header.jsx";
import Sidebar from "./Sidebar.jsx";
import TextOverlay from "./TextOverlay.jsx";
import BoardTitleBar from "./BoardTitleBar.jsx";
import BoardNotFound from "./BoardNotFound.jsx";

import styles from "./Whiteboard.module.css";

const Whiteboard = ({
  roomId = "general",
  token = "",
  onBackToDashboard,
  theme = "light",
  handleToggleTheme: onToggleTheme,
}) => {
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

  const {
    pan,
    setPan,
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
    isOwner,
    ownerId,
    peers,
    peerCursors,
    roomName,
    roomError,
    emitStroke,
    emitCursor,
    emitDelete,
    emitUpdate,
    emitRename,
  } = useSocket({
    roomId,
    token,
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

  const {
    isDrawingShape,
    shapePreview,
    handleShapePointerDown,
    handleShapePointerMove,
    handleShapePointerUp,
  } = useShape({
    tool,
    color,
    size,
    setElements,
    emitStroke,
    setUndoStack,
    setRedoStack,
  });

  const {
    textInput,
    textareaRef,
    handleTextPointerDown,
    handleTextPointerUp,
    handleTextDoubleClick,
    handleTextBlur,
    handleTextInput,
    handleTextKeyDown,
    isDismissingText,
  } = useText({
    canvasRef,
    elements,
    setElements,
    pan,
    zoom,
    color,
    size,
    setColor,
    setSelectedIds,
    setSelectionBox,
    emitStroke,
    emitUpdate,
    emitDelete,
    setUndoStack,
    setRedoStack,
  });

  const {
    mousePosRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleDoubleClick,
  } = useCanvasEvents({
    canvasRef,
    pan,
    zoom,
    tool,
    setTool,
    elements,
    setElements,
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
    emitDelete,
  });

  useClipboard({
    elements,
    setElements,
    selectedIds,
    setSelectedIds,
    mousePosRef,
    emitStroke,
    setUndoStack,
    setRedoStack,
  });

  // Remove the selection box if tool is not select
  useEffect(() => {
    if (tool !== "select") {
      setSelectedIds([]);
      setSelectionBox(null);
    }
  }, [tool, setSelectedIds, setSelectionBox]);

  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

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
    isDrawingShape,
    shapePreview,
    editingTextId: textInput?.id,
  });

  // To jump to an active user's cursor coordinates
  const jumpToUser = (userId) => {
    const peerPoint = peerCursors[userId];
    if (!peerPoint) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const newPanX = centerX - peerPoint.x * zoom;
    const newPanY = centerY - peerPoint.y * zoom;

    setPan({ x: newPanX, y: newPanY });
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";

    if (color === "#ffffff" && nextTheme === "light") setColor("#1e1e1e");
    if (color === "#1e1e1e" && nextTheme === "dark") setColor("#ffffff");

    // Call onToggleTheme from App.jsx
    onToggleTheme?.();
  };

  if (roomError) {
    return (
      <BoardNotFound
        error={roomError}
        onBackToDashboard={onBackToDashboard}
        theme={theme}
      />
    );
  }

  return (
    <div
      className={`${styles.container} ${theme === "dark" ? styles.darkContainer : ""}`}
    >
      <TextOverlay
        textInput={textInput}
        textareaRef={textareaRef}
        theme={theme}
        color={color}
        onBlur={handleTextBlur}
        onInput={handleTextInput}
        onKeyDown={handleTextKeyDown}
      />

      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        className={`${styles.canvas} ${tool === "hand" ? styles.cursorGrab : styles.cursorCrosshair}`}
      />

      {/* Top-Left: Navigation & Board Title */}
      <BoardTitleBar
        roomId={roomId}
        roomName={roomName}
        isOwner={isOwner}
        onBackToDashboard={onBackToDashboard}
        theme={theme}
        emitRename={emitRename}
      />

      {/* Top-Right: Actions (Share, Theme, Export, Profile) */}
      <Header
        roomId={roomId}
        roomName={roomName}
        token={token}
        theme={theme}
        handleToggleTheme={handleToggleTheme}
        elements={elements}
        peers={peers}
        jumpToUser={jumpToUser}
        ownerId={ownerId}
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

      {/* Render the sidebar */}
      <Sidebar tool={tool} setTool={setTool} theme={theme} />

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
