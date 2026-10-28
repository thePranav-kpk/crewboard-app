import { useState, useRef, useEffect } from "react";
import { worldToScreen } from "../utils/coordinates.js";
import { getStrokeBounds } from "../utils/hitTest.js";

const useText = ({
  canvasRef,
  elements,
  setElements,
  pan,
  zoom,
  color,
  size,
  emitStroke,
  emitUpdate,
  emitDelete,
  setUndoStack,
  setRedoStack,
  handleUndo,
  handleRedo,
}) => {
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

  const findHitText = (worldPoint) => {
    // Latest element will be on top so reverse the elements
    return [...elements].reverse().find((stroke) => {
      if (stroke.type !== "text") return false;

      const bounds = getStrokeBounds(stroke);
      const pad = 8 / zoom;

      return (
        bounds.minX - pad <= worldPoint.x &&
        worldPoint.x <= bounds.maxX + pad &&
        bounds.minY - pad <= worldPoint.y &&
        worldPoint.y <= bounds.maxY + pad
      );
    });
  };

  const openTextBox = (worldPoint, screenPoint, existingText = null) => {
    if (existingText) {
      // If hit on existing text box, convert canvas coordinates to screen coordinates
      const screenPoint = worldToScreen(
        { x: existingText.x, y: existingText.y },
        pan,
        zoom,
      );

      setTextInput({
        id: existingText.id,
        screenX: screenPoint.x,
        screenY: screenPoint.y,
        worldX: existingText.x,
        worldY: existingText.y,
        text: existingText.text,
        color: existingText.color,
        size: existingText.size,
      });
    } else {
      // Empty text box
      setTextInput({
        screenX: screenPoint.x ?? screenPoint.clientX,
        screenY: screenPoint.y ?? screenPoint.clientY,
        worldX: worldPoint.x,
        worldY: worldPoint.y,
        text: "",
      });
    }
  };

  const handleTextPointerUp = (e, worldPoint) => {
    // If just completed text input
    if (justBlurredRef.current) return;

    // If a text box is already open
    if (textInput) return;

    const hitText = findHitText(worldPoint);
    openTextBox(worldPoint, { x: e.clientX, y: e.clientY }, hitText);
  };

  const handleTextDoubleClick = (worldPoint) => {
    const hitText = findHitText(worldPoint);
    if (hitText) {
      openTextBox(worldPoint, null, hitText);
    }
  };

  const getWidthHeight = (text) => {
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

    return { width, height };
  };

  const handleTextBlur = (e) => {
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
        const { width, height } = getWidthHeight(text);

        // Updated element
        const updated = {
          ...existing,
          text,
          width,
          height,
        };

        // Add the action to undo stack and clear redo stack
        setUndoStack((prev) => [
          ...prev,
          { type: "edit", stroke: updated, previous: existing },
        ]);
        setRedoStack([]);

        // Broadcast to peers
        emitUpdate([updated]);

        // Replace the element with updated element
        setElements((prev) =>
          prev.map((el) => (el.id === textInput.id ? updated : el)),
        );
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
      const { width, height } = getWidthHeight(text);

      // New element
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

      // Add the action to undo stack and clear redo stack
      setUndoStack((prev) => [...prev, { type: "add", stroke: element }]);
      setRedoStack([]);

      // Broadcast to peers
      emitStroke(element);

      // Add to elements
      setElements((prev) => [...prev, element]);
    }

    // Clear text input
    setTextInput(null);
  };

  const handleTextInput = (e) => {
    // Push new text state to history on typing
    const val = e.target.value;
    const history = textHistoryRef.current.slice(
      0,
      textHistoryIdxRef.current + 1,
    );
    history.push(val);

    textHistoryRef.current = history;
    textHistoryIdxRef.current = history.length - 1;
  };

  const handleTextKeyDown = (e) => {
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    if (isCtrlOrCmd) {
      // Undo (Ctrl + Z)
      if (!e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();

        if (textHistoryIdxRef.current > 0) {
          // Undo text in the box
          textHistoryIdxRef.current--;
          e.target.value = textHistoryRef.current[textHistoryIdxRef.current];
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

        if (textHistoryIdxRef.current < textHistoryRef.current.length - 1) {
          // Redo text in the box
          textHistoryIdxRef.current++;
          e.target.value = textHistoryRef.current[textHistoryIdxRef.current];
        } else {
          // No more text to redo -> Redo canvas stroke
          handleRedo();
        }
        return;
      }
    }

    e.stopPropagation();

    // Clear text input when pressed Esc
    if (e.key === "Escape") {
      setTextInput(null);
      return;
    }

    // Render the text when pressed Enter and clear test box
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.target.blur();
      return;
    }
  };

  return {
    textInput,
    setTextInput,
    textareaRef,
    handleTextPointerUp,
    handleTextDoubleClick,
    handleTextBlur,
    handleTextInput,
    handleTextKeyDown,
  };
};

export default useText;
