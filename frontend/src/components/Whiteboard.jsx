/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useRef, useState, useEffect } from "react";
import usePanZoom from "../hooks/usePanZoom.js";
import { screenToWorld } from "../utils/coordinates.js";
import { renderStroke } from "../utils/draw.js";
import {
  isStrokeHit,
  isStrokeInBox,
  getStrokeBounds,
  getGroupBounds,
} from "../utils/hitTest.js";
import useSocket from "../hooks/useSocket.js";
import useHistory from "../hooks/useHistory.js";
import Toolbar from "./Toolbar.jsx";
import PeerCursors from "./PeerCursors.jsx";
import ZoomControls from "./ZoomControls.jsx";
import Header from "./Header.jsx";
import styles from "./Whiteboard.module.css";

const Whiteboard = () => {
  // Reference to Canvas DOM element
  const canvasRef = useRef(null);

  // Ref to check if dragging selected strokes
  const isDraggingSelectionRef = useRef(null);

  // Ref to store last dragged position
  const dragLastPosRef = useRef(null);

  // Ref to store position where dragging began
  const dragFirstPosRef = useRef(null);

  // Ref to store last timestamp when cursor changed
  const lastCursorEmitRef = useRef(0);

  // Array of all finished strokes
  const [elements, setElements] = useState([]);

  const [isDrawing, setIsDrawing] = useState(false);
  const currentPoints = useRef([]);

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

  // Store ids for selecting box
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectionBox, setSelectionBox] = useState(null);

  // Lazy initial state
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? savedTheme : "light";
  });

  // Ref to all strokes erased in one gesture (swipe)
  const erasedInCurrentGestureRef = useRef([]);

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
    setElements,
    emitStroke,
    emitDelete,
    emitUpdate,
  });

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

  // Zoom only the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // passive: false prevents toolbar and other components from zooming when canvas is zoomed
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Size the Canvas to Window
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;

    const handleResize = () => {
      canvas.height = window.innerHeight;
      canvas.width = window.innerWidth;
    };

    // Listen for browser window resizing
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Canvas redraw loop when elements change or when zoomed in,out or panned in,out
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Clear the screen to paint fresh
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Redraw all the elements
    // Pass theme to switch the stroke colors if same theme and similar color
    elements.forEach((stroke) => renderStroke(ctx, stroke, theme));

    // Draw highlighted box around selected strokes
    if (selectedIds.length > 0) {
      const selectedStrokes = elements.filter((s) =>
        selectedIds.includes(s.id),
      );
      const bounds = getGroupBounds(selectedStrokes);

      if (bounds) {
        ctx.save();
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 1.5 / zoom;
        ctx.setLineDash([4 / zoom, 4 / zoom]);

        const pad = 6 / zoom;
        ctx.strokeRect(
          bounds.minX - pad,
          bounds.minY - pad,
          bounds.width + pad * 2,
          bounds.height + pad * 2,
        );

        ctx.restore();
      }
    }

    // Draw active selection box (while dragging)
    if (selectionBox) {
      const { start, current } = selectionBox;

      const x = Math.min(start.x, current.x);
      const y = Math.min(start.y, current.y);
      const w = Math.abs(current.x - start.x);
      const h = Math.abs(current.y - start.y);

      ctx.save();

      ctx.strokeStyle = "#3b82f6";
      ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);

      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);

      ctx.restore();
    }

    if (isDrawing && currentPoints.current.length > 0) {
      renderStroke(
        ctx,
        {
          points: currentPoints.current,
          color,
          size,
        },
        theme,
      );
    }

    ctx.restore();
  }, [elements, pan, zoom, isDrawing, selectedIds, selectionBox, theme]);

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
    return screenToWorld(
      { x: e.clientX - rect.left, y: e.clientY - rect.top },
      pan,
      zoom,
    );
  };

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

  // Mouse held down for drawing
  const handlePointerDown = (e) => {
    // Get eraser coordinates
    const worldPoint = getWorldPoint(e);

    if (tool === "select") {
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
    }

    if (tool === "eraser") {
      // Collect all strokes erased in this gesture
      erasedInCurrentGestureRef.current = [];

      eraseStrokeAt(worldPoint);
    }

    // Check if mouse middle button (wheel click) pressed for dragging Canvas
    if (tool === "hand" || e.button === 1) {
      startPanning(e.clientX, e.clientY);
    }

    // Only pen can draw
    if (tool === "pen") {
      setIsDrawing(true);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();

      // Calculate the coordinates relative to top-left corner of Canvas
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      const worldPoint = screenToWorld({ x: screenX, y: screenY }, pan, zoom);

      // Set the first point to start a stroke
      currentPoints.current = [worldPoint];
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
      if (isDraggingSelectionRef.current) {
        const deltaX = worldPoint.x - dragLastPosRef.current.x;
        const deltaY = worldPoint.y - dragLastPosRef.current.y;

        setElements((prev) =>
          prev.map((stroke) => {
            if (selectedIds.includes(stroke.id)) {
              return {
                ...stroke,
                points: stroke.points.map((point) => ({
                  x: point.x + deltaX,
                  y: point.y + deltaY,
                })),
              };
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
    }

    if (tool === "eraser" && e.buttons === 1) {
      eraseStrokeAt(worldPoint);
    }

    if (isPanning) {
      updatePan(e.clientX, e.clientY);
    } else if (isDrawing) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();

      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      const worldPoint = screenToWorld({ x: screenX, y: screenY }, pan, zoom);

      // Add to the current points
      currentPoints.current.push(worldPoint);

      // Paint the active line (collection of current points)
      const ctx = canvas.getContext("2d");

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      renderStroke(ctx, { points: currentPoints.current, color, size }, theme);

      ctx.restore();
    }
  };

  // Mouse released (held up)
  const handlePointerUp = (e) => {
    if (tool === "eraser") {
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
    }

    if (tool === "select") {
      // Indicates dragging completed
      if (isDraggingSelectionRef.current) {
        const worldPoint = getWorldPoint(e);

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
    }

    if (isPanning) {
      stopPanning();
    } else if (isDrawing) {
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
