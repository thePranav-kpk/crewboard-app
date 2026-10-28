/* eslint-disable no-unused-vars */
import { useRef, useState, useEffect } from "react";

import { screenToWorld, worldToScreen } from "../utils/coordinates.js";
import { getStrokeBounds } from "../utils/hitTest.js";

import usePanZoom from "../hooks/usePanZoom.js";
import useSocket from "../hooks/useSocket.js";
import useHistory from "../hooks/useHistory.js";
import useSelection from "../hooks/useSelection.js";
import useCanvasRender from "../hooks/useCanvasRender.js";
import usePen from "../hooks/usePen.js";
import useEraser from "../hooks/useEraser.js";
import useShape from "../hooks/useShape.js";

import Toolbar from "./Toolbar.jsx";
import PeerCursors from "./PeerCursors.jsx";
import ZoomControls from "./ZoomControls.jsx";
import Header from "./Header.jsx";
import Sidebar from "./Sidebar.jsx";

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

  // Store text input
  const [textInput, setTextInput] = useState(null);

  // Ref to textarea DOM node
  const textareaRef = useRef(null);

  // If just completed text input, prevents rendering new text box when clicked outside the box
  const justBlurredRef = useRef(false);

  // Store text history as entered
  const textHistoryRef = useRef([]);

  // Ref to store index of text history
  const textHistoryIdxRef = useRef(-1);

  // Stores text input as it changes
  useEffect(() => {
    if (textInput && textareaRef.current) {
      const el = textareaRef.current;

      // Focus the textarea DOM node
      el.focus();

      const len = el.value.length;

      // Position the cursor at end of text
      el.setSelectionRange(len, len);

      // Initialize text history for this typing session
      textHistoryRef.current = [textInput.text || ""];
      textHistoryIdxRef.current = 0;
    }
  }, [textInput]);

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
    isDrawingShape,
    shapePreview,
    editingTextId: textInput?.id,
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

    if (
      tool === "rectangle" ||
      tool === "circle" ||
      tool === "arrow" ||
      tool === "line"
    ) {
      handleShapePointerDown(worldPoint);
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

    if (
      (tool === "rectangle" ||
        tool === "circle" ||
        tool === "arrow" ||
        tool === "line") &&
      e.buttons === 1
    ) {
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

    if (tool === "eraser") {
      handleEraserPointerUp();
    }

    if (tool === "select") {
      // Indicates dragging completed
      const worldPoint = getWorldPoint(e);
      handleSelectionPointerUp(worldPoint);
    }

    if (
      tool === "rectangle" ||
      tool === "circle" ||
      tool === "arrow" ||
      tool === "line"
    ) {
      handleShapePointerUp(worldPoint);
    }

    if (tool === "text" && !isPanning) {
      // If just completed text input
      if (justBlurredRef.current) return;

      // If a text box is already open
      if (textInput) return;

      // Check if clicked on an existing text box to reselect and edit it
      const hitText = [...elements].reverse().find((stroke) => {
        if (stroke.type !== "text") return false;

        const bounds = getStrokeBounds(stroke);
        const pad = 8 / zoom;

        return (
          worldPoint.x >= bounds.minX - pad &&
          worldPoint.x <= bounds.maxX + pad &&
          worldPoint.y >= bounds.minY - pad &&
          worldPoint.y <= bounds.maxY + pad
        );
      });

      if (hitText) {
        // If hit on existing text box, convert canvas coordinates to screen coordinates
        const screenPoint = worldToScreen(
          { x: hitText.x, y: hitText.y },
          pan,
          zoom,
        );

        setTextInput({
          id: hitText.id,
          screenX: screenPoint.x,
          screenY: screenPoint.y,
          worldX: hitText.x,
          worldY: hitText.y,
          text: hitText.text,
          color: hitText.color,
          size: hitText.size,
        });
      } else {
        // Empty text boint
        setTextInput({
          screenX: e.clientX,
          screenY: e.clientY,
          worldX: worldPoint.x,
          worldY: worldPoint.y,
          text: "",
        });
      }
    }

    if (isPanning) {
      stopPanning();
    } else if (isDrawing) {
      handlePenPointerUp();
    }
  };

  // Double click to edit text box
  const handleDoubleClick = (e) => {
    const worldPoint = getWorldPoint(e);

    const hitText = [...elements].reverse().find((stroke) => {
      if (stroke.type !== "text") return false;

      const bounds = getStrokeBounds(stroke);
      const pad = 8 / zoom;

      return (
        worldPoint.x >= bounds.minX - pad &&
        worldPoint.x <= bounds.maxX + pad &&
        worldPoint.y >= bounds.minY - pad &&
        worldPoint.y <= bounds.maxY + pad
      );
    });

    if (hitText) {
      const screenPoint = worldToScreen(
        { x: hitText.x, y: hitText.y },
        pan,
        zoom,
      );

      setTextInput({
        id: hitText.id,
        screenX: screenPoint.x,
        screenY: screenPoint.y,
        worldX: hitText.x,
        worldY: hitText.y,
        text: hitText.text,
        color: hitText.color,
        size: hitText.size,
      });
    }
  };

  const handleBlur = (e) => {
    justBlurredRef.current = true;
    setTimeout(() => {
      justBlurredRef.current = false;
    }, 150);

    if (!textInput) return;

    const text = e.target.value.trim();

    if (textInput.id) {
      // Reselecting and editing an existing text element
      const existing = elements.find((el) => el.id === textInput.id);

      if (text.length > 0) {
        // Caclulate no. of lines
        const lines = text.split("\n");

        const ctx = canvasRef.current.getContext("2d");
        ctx.font = "24px sans-serif";

        // Width of text box = Max. width of all lines
        const width = Math.max(
          ...lines.map((line) => ctx.measureText(line).width),
          20,
        );

        // Height of text box = No. of lines * Height of each line
        const height = lines.length * 30;

        // Updated element
        const updated = {
          ...existing,
          text,
          width,
          height,
        };

        // Add to elements
        setElements((prev) =>
          prev.map((el) => (el.id === textInput.id ? updated : el)),
        );

        // Broadcast to peers
        emitUpdate([updated]);

        // Add the action to undo stack and clear redo stack
        setUndoStack((prev) => [
          ...prev,
          { type: "edit", stroke: updated, previous: existing },
        ]);
        setRedoStack([]);
      }
      // If no text ie all text has been backspaced
      else {
        // Remove element
        setElements((prev) => prev.filter((el) => el.id !== textInput.id));

        // Broadcast to peers
        emitDelete(textInput.id);

        if (existing) {
          // Add the action to undo stack and clear redo stack
          setUndoStack((prev) => [
            ...prev,
            { type: "erase", strokes: [existing] },
          ]);
          setRedoStack([]);
        }
      }
    }
    // New text box
    else if (text.length > 0) {
      const lines = text.split("\n");

      const ctx = canvasRef.current.getContext("2d");
      ctx.font = "24px sans-serif";

      const width = Math.max(
        ...lines.map((line) => ctx.measureText(line).width),
        20,
      );

      const height = lines.length * 30;

      const element = {
        id: crypto.randomUUID(),
        type: "text",
        text,
        x: textInput.worldX,
        y: textInput.worldY,
        width,
        height,
        color,
        size,
      };

      setUndoStack((prev) => [...prev, { type: "add", stroke: element }]);
      setRedoStack([]);

      emitStroke(element);

      setElements((prev) => [...prev, element]);
    }

    // Clear text input
    setTextInput(null);
  };

  return (
    <div
      className={`${styles.container} ${theme === "dark" ? styles.darkContainer : ""}`}
    >
      {textInput && (
        <textarea
          ref={textareaRef}
          key={textInput.id || "new"}
          autoFocus
          defaultValue={textInput.text || ""}
          className={styles.textOverlay}
          style={{
            left: textInput.screenX,
            top: textInput.screenY,
            color:
              theme === "dark" && (textInput.color || color) === "#1e1e1e"
                ? "#ffffff"
                : theme === "light" && (textInput.color || color) === "#ffffff"
                  ? "#1e1e1e"
                  : textInput.color || color,
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onBlur={handleBlur}
          onInput={(e) => {
            // Push new text state to history on typing
            const val = e.target.value;
            const history = textHistoryRef.current.slice(
              0,
              textHistoryIdxRef.current + 1,
            );
            history.push(val);

            textHistoryRef.current = history;
            textHistoryIdxRef.current = history.length - 1;
          }}
          onKeyDown={(e) => {
            const isCtrlOrCmd = e.ctrlKey || e.metaKey;

            if (isCtrlOrCmd) {
              // Undo (Ctrl + Z)
              if (!e.shiftKey && e.key.toLowerCase() === "z") {
                e.preventDefault();

                if (textHistoryIdxRef.current > 0) {
                  // Undo text in the box
                  textHistoryIdxRef.current--;
                  e.target.value =
                    textHistoryRef.current[textHistoryIdxRef.current];
                } else {
                  // Reached the start -> Close text box and undo canvas stroke
                  setTextInput(null);
                  handleUndo();
                }
                return;
              }

              // Redo (Ctrl + Y or Ctrl + Shift + Z)
              if (
                e.key.toLowerCase() === "y" ||
                (e.shiftKey && e.key.toLowerCase() === "z")
              ) {
                e.preventDefault();

                if (
                  textHistoryIdxRef.current <
                  textHistoryRef.current.length - 1
                ) {
                  // Redo text in the box
                  textHistoryIdxRef.current++;
                  e.target.value =
                    textHistoryRef.current[textHistoryIdxRef.current];
                } else {
                  // No more text to redo -> Redo canvas stroke
                  handleRedo();
                }
                return;
              }
            }

            e.stopPropagation();

            if (e.key === "Escape") {
              setTextInput(null);
              return;
            }

            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.target.blur();
              return;
            }
          }}
        />
      )}

      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
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
