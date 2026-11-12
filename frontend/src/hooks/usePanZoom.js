import { useEffect, useState } from "react";
import { screenToWorld } from "../utils/coordinates";

const usePanZoom = (tool) => {
  // Lazy initial state -> For first render JS calculates the function and for next renders it directly uses the value initialized
  const [zoom, setZoom] = useState(() => {
    const savedZoomLevel = localStorage.getItem("zoom_level");
    return savedZoomLevel ? parseFloat(savedZoomLevel) : 1;
  });

  const [pan, setPan] = useState(() => {
    const savedPanValue = localStorage.getItem("pan_value");
    return savedPanValue ? JSON.parse(savedPanValue) : { x: 0, y: 0 };
  });

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Store zoom, pan in localStoarge
  useEffect(() => {
    localStorage.setItem("zoom_level", zoom.toString());
    localStorage.setItem("pan_value", JSON.stringify(pan));
  }, [zoom, pan]);

  // To zoom in or out
  const handleWheel = (e) => {
    e.preventDefault();

    // When on Hand tool: 2D Pan navigation (up, down, left, right)

    // Ctrl + Mouse Wheel (Used for intentional zooming) so only navigate if not holding Ctrl / Cmd
    if (tool === "hand" && !(e.ctrlKey || e.metaKey)) {
      // Support Shift + vertical mouse wheel for horizontal scrolling on standard mouse
      const dx = e.shiftKey && e.deltaX === 0 ? e.deltaY : e.deltaX;
      const dy = e.shiftKey ? 0 : e.deltaY;

      setPan((prev) => ({
        x: prev.x - dx,
        y: prev.y - dy,
      }));

      return;
    }

    // Zoom navigation: On other tools or when holding Ctrl/Cmd on Hand tool

    // Get cursor position relative to window (or canvas container)
    const cursorX = e.clientX;
    const cursorY = e.clientY;

    const rawDelta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;

    // Determine zoom scale factor
    const zoomFactor = Math.exp(-rawDelta * 0.0015);

    // Safety clamp per event to prevent sudden jumps from high-momentum trackpad flicks
    const clampedFactor = Math.min(Math.max(zoomFactor, 0.85), 1.15);
    const newZoom = Math.min(Math.max(zoom * clampedFactor, 0.1), 5.0);

    // Find world coordinates under cursor
    const worldPoint = screenToWorld({ x: cursorX, y: cursorY }, pan, zoom);

    // Calculate new pan offsets
    const newPanX = cursorX - worldPoint.x * newZoom;
    const newPanY = cursorY - worldPoint.y * newZoom;

    // Update state
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // To drag the canvas
  const startPanning = (screenX, screenY) => {
    setIsPanning(true);
    // Store the difference between click position and current pan
    setPanStart({ x: screenX - pan.x, y: screenY - pan.y });
  };

  // Update pan offset as the mouse moves
  const updatePan = (screenX, screenY) => {
    if (!isPanning) return;
    setPan({
      x: screenX - panStart.x,
      y: screenY - panStart.y,
    });
  };

  // Stop dragging
  const stopPanning = () => {
    setIsPanning(false);
  };

  // Reset canvas view to origin
  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  // Handle zooming in
  const zoomIn = () => {
    const zoomFactor = 1.2;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.1), 5.0);

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Find world coordinates around center
    const worldPoint = screenToWorld({ x: centerX, y: centerY }, pan, zoom);

    // Calculate new pan offsets
    const newPanX = centerX - worldPoint.x * newZoom;
    const newPanY = centerY - worldPoint.y * newZoom;

    // Update state
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Handle zooming out
  const zoomOut = () => {
    const zoomFactor = 0.8;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.1), 5.0);

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Find world coordinates around center
    const worldPoint = screenToWorld({ x: centerX, y: centerY }, pan, zoom);

    // Calculate new pan offsets
    const newPanX = centerX - worldPoint.x * newZoom;
    const newPanY = centerY - worldPoint.y * newZoom;

    // Update state
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  return {
    pan,
    zoom,
    isPanning,
    handleWheel,
    startPanning,
    updatePan,
    stopPanning,
    resetView,
    setPan,
    setZoom,
    zoomIn,
    zoomOut,
  };
};

export default usePanZoom;
