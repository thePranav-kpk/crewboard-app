/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useRef, useState, useEffect } from "react";
import usePanZoom from "../hooks/usePanZoom.js";
import { screenToWorld } from "../utils/coordinates.js";
import { renderStroke } from "../utils/draw.js";
import { isStrokeHit } from "../utils/hitTest.js";
import useSocket from "../hooks/useSocket.js";
import Toolbar from "./Toolbar.jsx";
import styles from "./Whiteboard.module.css";

const Whiteboard = () => {
  // Reference to Canvas DOM element
  const canvasRef = useRef(null);

  // Array of all finished strokes
  const [elements, setElements] = useState([]);

  const [isDrawing, setIsDrawing] = useState(false);
  const currentPoints = useRef([]);

  // Store all current drawing options
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(4);

  const {
    pan,
    zoom,
    isPanning,
    handleWheel,
    startPanning,
    updatePan,
    stopPanning,
  } = usePanZoom();

  const {
    isConnected,
    peers,
    peerCursors,
    emitStroke,
    emitCursor,
    emitDelete,
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
  });

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
    elements.forEach((stroke) => renderStroke(ctx, stroke));

    if (isDrawing && currentPoints.current.length > 0) {
      renderStroke(ctx, {
        points: currentPoints.current,
        color,
        size,
      });
    }

    ctx.restore();
  }, [elements, pan, zoom, isDrawing]);

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

    if (tool === "eraser") {
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

      // Broadcast world-coordinates to peers
      emitCursor(worldPoint.x, worldPoint.y);

      // Add to the current points
      currentPoints.current.push(worldPoint);

      // Paint the active line (collection of current points)
      const ctx = canvas.getContext("2d");

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      renderStroke(ctx, { points: currentPoints.current, color, size });

      ctx.restore();
    }
  };

  // Mouse released (held up)
  const handlePointerUp = (e) => {
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
        // Broadcast the new stroke to peers
        emitStroke(newStroke);

        // Trigger redraw loop to persist stroke on Canvas board
        setElements((prev) => [...prev, newStroke]);
      }
    }
  };

  return (
    <div className={styles.container}>
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`${styles.canvas} ${tool === "hand" ? styles.cursorGrab : styles.cursorCrosshair}`}
      />

      {/* Render the toolbar */}
      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        size={size}
        setSize={setSize}
      />
    </div>
  );
};

export default Whiteboard;
