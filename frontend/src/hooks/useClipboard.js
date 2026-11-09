/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
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
  setTool,
}) => {
  const copySelected = () => {
    if (!selectedIds.length) return;

    const updatedElements = elements.filter((el) =>
      selectedIds.includes(el.id),
    );

    // Copy to local storage
    try {
      localStorage.setItem(
        "crewboard:clipboard",
        JSON.stringify(updatedElements),
      );
    } catch (err) {
      console.error("Error in copying elements to clipboard: ", err);
    }
  };

  const pasteCopied = (atMouse = true) => {
    let copiedElements = [];

    try {
      const raw = localStorage.getItem("crewboard:clipboard");
      copiedElements = raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error("Error reading clipboard: ", err);
    }
    if (!copiedElements.length) return;

    // Returns: { minX, maxX, minY, maxY, width, height }
    const bounds = getGroupBounds(copiedElements);

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
    const newElements = copiedElements.map((el) => {
      // Copy to new position
      const movedStroke = moveStroke(el, dx, dy);
      return {
        ...movedStroke,
        id: crypto.randomUUID(),
      };
    });

    // Add clones to actual elements
    setElements((prev) => [...prev, ...newElements]);

    // Store clones to local storage for consecutive copies
    localStorage.setItem("crewboard:clipboard", JSON.stringify(newElements));

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
      // Ctrl + A -> Select all elements
      else if (e.key.toLowerCase() === "a") {
        e.preventDefault();
        if (!elements.length) return;

        setTool("select");

        // Select all elements
        setSelectedIds(elements.map((el) => el.id));
      }
    };

    window.addEventListener("keydown", handleKeydown);

    return () => window.removeEventListener("keydown", handleKeydown);
  }, [elements, selectedIds]);

  return { copySelected, pasteCopied };
};

export default useClipboard;
