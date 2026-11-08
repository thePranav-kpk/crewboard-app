/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from "react";
import { moveStroke } from "../utils/coordinates.js";
import { getGroupBounds } from "../utils/hitTest.js";

const useClipboard = ({
  elements,
  setElements,
  selectedIds,
  setSelectedIds,
  mousePosRef,
  emitStroke,
  setUndoStack,
  setRedoStack,
}) => {
  // Ref to store copied elements
  const clipboardRef = useRef([]);

  const copySelected = () => {
    if (!selectedIds.length) return;

    const updatedElements = elements.filter((el) =>
      selectedIds.includes(el.id),
    );

    // Store in Ref
    clipboardRef.current = structuredClone(updatedElements);
  };

  const pasteCopied = (atMouse = true) => {
    if (!clipboardRef.current.length) return;

    // Returns: { minX, maxX, minY, maxY, width, height }
    const bounds = getGroupBounds(clipboardRef.current);

    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;

    let dx = 20;
    let dy = 20;

    if (atMouse && mousePosRef.current) {
      dx = mousePosRef.current.x - centerX;
      dy = mousePosRef.current.y - centerY;

      // Update mouse coordinates for consecutive copies
      mousePosRef.current = {
        x: mousePosRef.current.x + 20,
        y: mousePosRef.current.y + 20,
      };
    }

    // Update id of copied elements (clones) and move them by (dx,dy) from actual element
    const newElements = clipboardRef.current.map((el) => {
      // Copy to new position
      const movedStroke = moveStroke(el, dx, dy);
      return {
        ...movedStroke,
        id: crypto.randomUUID(),
      };
    });

    // Add clones to actual elements
    setElements((prev) => [...prev, ...newElements]);

    // Store clones in Ref for consecutive copies
    clipboardRef.current = newElements;

    // Select the pasted elements to drag them
    setSelectedIds(newElements.map((el) => el.id));

    // Broadcast to peers
    newElements.forEach((el) => emitStroke(el));

    // Add clones to undo stack and clear the redo stack
    setUndoStack((prev) => [
      ...prev,
      { type: "batch_add", elements: newElements },
    ]);
    setRedoStack([]);
  };

  // Handle copy and paste using keys
  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (!isCtrlOrCmd) return;

      if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        copySelected();
      } else if (e.key.toLowerCase() === "v") {
        e.preventDefault();
        pasteCopied(true);
      }
      // Ctrl + D -> Copy and Paste in one key
      else if (e.key.toLowerCase() === "d") {
        e.preventDefault();
        copySelected();
        pasteCopied(false);
      }
    };

    window.addEventListener("keydown", handleKeydown);

    return () => window.removeEventListener("keydown", handleKeydown);
  }, [elements, selectedIds]);

  return { copySelected, pasteCopied };
};

export default useClipboard;
