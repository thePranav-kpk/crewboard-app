import { useState } from "react";
import { screenToWorld } from "../utils/coordinates";

const usePanZoom = () => {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // To zoom in or out
  const handleWheel = (e) => {
    e.preventDefault();

    // Get cursor position relative to window (or canvas container)
    const cursorX = e.clientX;
    const cursorY = e.clientY;

    // Determine zoom scale factor
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.1), 5.0);

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
