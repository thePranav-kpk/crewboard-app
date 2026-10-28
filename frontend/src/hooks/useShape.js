import { useRef, useState } from "react";

const useShape = ({
  tool,
  color,
  size,
  setElements,
  emitStroke,
  setUndoStack,
  setRedoStack,
}) => {
  const [isDrawingShape, setIsDrawingShape] = useState(false);

  // Ref to store the starting point of shape
  const shapeStartRef = useRef(null);

  // Store shape preview
  const [shapePreview, setShapePreview] = useState(null);

  const getWidthHeight = (worldPoint) => {
    const width = Math.abs(worldPoint.x - shapeStartRef.current.x);
    const height = Math.abs(worldPoint.y - shapeStartRef.current.y);
    return { width, height };
  };

  const getRadius = (width, height) => {
    return Math.max(width, height) / 2;
  };

  const handleShapePointerDown = (worldPoint) => {
    setIsDrawingShape(true);

    // Store the starting point of rectangle
    shapeStartRef.current = worldPoint;
  };

  const handleShapePointerMove = (worldPoint) => {
    if (!isDrawingShape) return;

    const { width, height } = getWidthHeight(worldPoint);

    if (tool === "rectangle") {
      // Store the (x,y) and width, height to form rectangle
      setShapePreview({
        type: "rectangle",
        x: Math.min(worldPoint.x, shapeStartRef.current.x),
        y: Math.min(worldPoint.y, shapeStartRef.current.y),
        width,
        height,
        color,
        size,
      });
    } else if (tool === "circle") {
      const radius = getRadius(width, height);

      setShapePreview({
        type: "circle",
        // Center coordinates-> (minX + radius,minY + radius)
        centerX: Math.min(worldPoint.x, shapeStartRef.current.x) + radius,
        centerY: Math.min(worldPoint.y, shapeStartRef.current.y) + radius,
        radius,
        color,
        size,
      });
    } else if (tool === "arrow" || tool === "line") {
      setShapePreview({
        type: tool,
        startX: shapeStartRef.current.x,
        startY: shapeStartRef.current.y,
        endX: worldPoint.x,
        endY: worldPoint.y,
        width,
        height,
        color,
        size,
      });
    }
  };

  const handleShapePointerUp = (worldPoint) => {
    setIsDrawingShape(false);

    const { width, height } = getWidthHeight(worldPoint);

    if (width > 0 || height > 0) {
      let element = {};
      if (tool === "rectangle") {
        element = {
          id: crypto.randomUUID(),
          type: "rectangle",
          x: Math.min(worldPoint.x, shapeStartRef.current.x),
          y: Math.min(worldPoint.y, shapeStartRef.current.y),
          width,
          height,
          color,
          size,
        };
      } else if (tool === "circle") {
        const radius = getRadius(width, height);

        element = {
          id: crypto.randomUUID(),
          type: "circle",
          centerX: Math.min(worldPoint.x, shapeStartRef.current.x) + radius,
          centerY: Math.min(worldPoint.y, shapeStartRef.current.y) + radius,
          radius,
          color,
          size,
        };
      } else if (tool === "arrow" || tool === "line") {
        element = {
          id: crypto.randomUUID(),
          type: tool,
          startX: shapeStartRef.current.x,
          startY: shapeStartRef.current.y,
          endX: worldPoint.x,
          endY: worldPoint.y,
          width,
          height,
          color,
          size,
        };
      }

      // Add the action to undo stack and clear redo stack
      setUndoStack((prev) => [...prev, { type: "add", stroke: element }]);
      setRedoStack([]);

      // Broadcast to peers
      emitStroke(element);

      // Add to elements
      setElements((prev) => [...prev, element]);
    }

    setShapePreview(null);
  };

  return {
    isDrawingShape,
    shapePreview,
    handleShapePointerDown,
    handleShapePointerMove,
    handleShapePointerUp,
  };
};

export default useShape;
