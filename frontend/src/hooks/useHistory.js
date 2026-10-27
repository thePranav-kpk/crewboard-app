/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";

const useHistory = ({
  elementsRef,
  setElements,
  emitStroke,
  emitDelete,
  emitUpdate,
}) => {
  // Store actions for undo and redo shortcuts and buttons
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const action = undoStack[undoStack.length - 1];

    // Remove from undo stack
    setUndoStack((prev) => prev.slice(0, -1));

    if (action.type === "add") {
      // Remove the added stroke from canvas
      setElements((prev) =>
        prev.filter((stroke) => stroke.id !== action.stroke.id),
      );

      // Broadcast to peers
      emitDelete(action.stroke.id);

      // Add to redo stack
      setRedoStack((prev) => [...prev, action]);
    } else if (action.type === "erase") {
      // Add the erased strokes back to canvas
      setElements((prev) => [...prev, ...action.strokes]);

      // Broadcast to peers
      action.strokes.forEach((stroke) => emitStroke(stroke));

      // Add to redo stack
      setRedoStack((prev) => [...prev, action]);
    } else if (action.type === "move") {
      // Move the strokes, rectangle back to original position
      const updatedElements = [];

      const nextElements = elementsRef.current.map((stroke) => {
        if (action.strokeIds.includes(stroke.id)) {
          if (stroke.type === "stroke" || !stroke.type) {
            // Moved stroke
            const movedStroke = {
              ...stroke,
              points: stroke.points.map((point) => ({
                x: point.x - action.dx,
                y: point.y - action.dy,
              })),
            };

            updatedElements.push(movedStroke);
            return movedStroke;
          } else if (stroke.type === "rectangle") {
            // Moved rectangle
            const movedRectangle = {
              ...stroke,
              x: stroke.x - action.dx,
              y: stroke.y - action.dy,
            };

            updatedElements.push(movedRectangle);
            return movedRectangle;
          } else if (stroke.type === "circle") {
            // Moved circle
            const movedCircle = {
              ...stroke,
              centerX: stroke.centerX - action.dx,
              centerY: stroke.centerY - action.dy,
            };

            updatedElements.push(movedCircle);
            return movedCircle;
          } else if (stroke.type === "arrow") {
            // Moved arrow
            const movedArrow = {
              ...stroke,
              startX: stroke.startX - action.dx,
              startY: stroke.startY - action.dy,
              endX: stroke.endX - action.dx,
              endY: stroke.endY - action.dy,
            };

            updatedElements.push(movedArrow);
            return movedArrow;
          }
        }

        return stroke;
      });

      elementsRef.current = nextElements;
      setElements(nextElements);

      // Broadcast to peers
      emitUpdate(updatedElements);

      // Add to redo stack
      setRedoStack((prev) => [...prev, action]);
    }
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const action = redoStack[redoStack.length - 1];

    // Remove from redo stack
    setRedoStack((prev) => prev.slice(0, -1));

    if (action.type === "add") {
      // Add the stroke back to canvas
      setElements((prev) => [...prev, action.stroke]);

      // Broadcast to peers
      emitStroke(action.stroke);

      // Add to undo stack
      setUndoStack((prev) => [...prev, action]);
    } else if (action.type === "erase") {
      const erasedIds = action.strokes.map((stroke) => stroke.id);

      // Remove the strokes from canvas
      setElements((prev) =>
        prev.filter((element) => !erasedIds.includes(element.id)),
      );

      // Broadcast to peers
      action.strokes.forEach((stroke) => emitDelete(stroke.id));

      // Add to undo stack
      setUndoStack((prev) => [...prev, action]);
    } else if (action.type === "move") {
      // Move the strokes, rectangle back to original position
      const updatedElements = [];

      const nextElements = elementsRef.current.map((stroke) => {
        if (action.strokeIds.includes(stroke.id)) {
          if (stroke.type === "stroke" || !stroke.type) {
            // Moved stroke
            const movedStroke = {
              ...stroke,
              points: stroke.points.map((point) => ({
                x: point.x + action.dx,
                y: point.y + action.dy,
              })),
            };

            updatedElements.push(movedStroke);
            return movedStroke;
          } else if (stroke.type === "rectangle") {
            // Moved rectangle
            const movedRectangle = {
              ...stroke,
              x: stroke.x + action.dx,
              y: stroke.y + action.dy,
            };

            updatedElements.push(movedRectangle);
            return movedRectangle;
          } else if (stroke.type === "circle") {
            // Moved circle
            const movedCircle = {
              ...stroke,
              centerX: stroke.centerX + action.dx,
              centerY: stroke.centerY + action.dy,
            };

            updatedElements.push(movedCircle);
            return movedCircle;
          } else if (stroke.type === "arrow") {
            // Moved arrow
            const movedArrow = {
              ...stroke,
              startX: stroke.startX + action.dx,
              startY: stroke.startY + action.dy,
              endX: stroke.endX + action.dx,
              endY: stroke.endY + action.dy,
            };

            updatedElements.push(movedArrow);
            return movedArrow;
          }
        }

        return stroke;
      });

      elementsRef.current = nextElements;
      setElements(nextElements);

      // Broadcast to peers
      emitUpdate(updatedElements);

      // Add to undo stack
      setUndoStack((prev) => [...prev, action]);
    }
  };

  // Handle undo and redo using keys
  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      // Ctrl-> Windows, Cmd-> Mac
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (!isCtrlOrCmd) return;

      // Ctrl + Z -> Mac and Windows
      if (!e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
      }

      // Ctrl + Shift + Z -> Mac
      // Ctrl + Y -> Windows
      if (
        e.key.toLowerCase() === "y" ||
        (e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeydown);

    return () => window.removeEventListener("keydown", handleKeydown);
  }, [undoStack, redoStack]);

  return {
    undoStack,
    redoStack,
    setUndoStack,
    setRedoStack,
    handleUndo,
    handleRedo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  };
};

export default useHistory;
