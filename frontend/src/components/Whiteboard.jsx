/* eslint-disable no-unused-vars */
import { useRef, useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";

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

  // Array of all finished strokes
  const [elements, setElements] = useState([]);
  const elementsRef = useRef(elements);

  // Store all current drawing options
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState(() =>
    theme === "light" ? "#1e1e1e" : "#ffffff",
  );
  const [size, setSize] = useState(4);

  const { user } = useAuth();

  // Store last used Sticky Note color and stroke color to help switching between tools
  const [lastNoteColor, setLastNoteColor] = useState("#fef08a");
  const [lastStrokeColor, setLastStrokeColor] = useState(() =>
    theme === "light" ? "#1e1e1e" : "#ffffff",
  );

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
    isLocked,
    setIsLocked,
    inviteToken,
    setInviteToken,
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
    canvasRef,
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
    setTextInput,
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
    tool,
    user,
    color,
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
    setTool,
  });

  // Remove the selection box if tool is not select
  useEffect(() => {
    if (tool !== "select") {
      setSelectedIds([]);
      setSelectionBox(null);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = "";
      }
    }
  }, [tool, setSelectedIds, setSelectionBox]);

  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  // Remove token from URL after joining the board (To prevent room sharing after room is locked)
  useEffect(() => {
    if (window.location.search.includes("token")) {
      window.history.replaceState({}, "", `/room/${roomId}`);
    }
  }, [roomId]);

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

  // Get CSS cursor class based on active tool
  const getToolCursorClass = () => {
    if (tool === "hand") {
      return isPanning ? styles.cursorGrabbing : styles.cursorGrab;
    }
    if (tool === "pen") {
      return styles.cursorPen;
    }
    if (tool === "eraser") {
      return styles.cursorEraser;
    }
    if (tool === "text") {
      return styles.cursorText;
    }
    if (tool === "select") {
      return styles.cursorMagic;
    }
    return styles.cursorCrosshair;
  };

  // Handle color changes when switching from Sticky Note to other tools
  const handleToolChange = (newTool) => {
    // Set last used Sticky Note color if switched to Sticky Note
    if (newTool === "note") setColor(lastNoteColor);
    // Set last used stroke color if switched out of Sticky Note to any other tool
    else setColor(lastStrokeColor);

    setTool(newTool);
  };

  const handleColorChange = (newColor) => {
    setColor(newColor);

    // Typing inside a note (Editing mode)
    if (textInput) {
      setTextInput((prev) => (prev ? { ...prev, color: newColor } : null));

      // Existing note
      if (textInput.id) {
        setElements((prev) => {
          const updated = prev.map((el) =>
            el.id === textInput.id ? { ...el, color: newColor } : el,
          );

          // Broadcast to peers about change in color
          emitUpdate(updated.filter((el) => el.id === textInput.id));
          return updated;
        });
      }
      return;
    }

    // Selecting notes with the Magic Pen (Selection mode)
    if (selectedIds.length > 0) {
      const previousElements = elements.filter((el) =>
        selectedIds.includes(el.id),
      );
      const updatedElements = elements.map((el) =>
        selectedIds.includes(el.id) ? { ...el, color: newColor } : el,
      );

      setElements(updatedElements);

      const changedElements = updatedElements.filter((el) =>
        selectedIds.includes(el.id),
      );

      // Broadcast to peers about change in color
      emitUpdate(changedElements);

      if (previousElements.length > 0) {
        setUndoStack((prev) => [
          ...prev,
          previousElements.length === 1
            ? {
                type: "edit",
                stroke: changedElements[0],
                previous: previousElements[0],
              }
            : {
                type: "batch_edit",
                current: changedElements,
                previous: previousElements,
              },
        ]);
        setRedoStack([]);
      }
    }
  };

  return (
    <div
      className={`${styles.container} ${theme === "dark" ? styles.darkContainer : ""}`}
    >
      <TextOverlay
        textInput={textInput}
        textareaRef={textareaRef}
        theme={theme}
        color={color}
        zoom={zoom}
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
        className={`${styles.canvas} ${getToolCursorClass()}`}
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
        isLocked={isLocked}
        setIsLocked={setIsLocked}
        isOwner={isOwner}
        token={inviteToken || token}
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
        setTool={handleToolChange}
        color={color}
        setColor={handleColorChange}
        setLastNoteColor={setLastNoteColor}
        setLastStrokeColor={setLastStrokeColor}
        size={size}
        setSize={setSize}
        theme={theme}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        elements={elements}
        selectedIds={selectedIds}
      />

      {/* Render the sidebar */}
      <Sidebar tool={tool} setTool={handleToolChange} theme={theme} />

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
