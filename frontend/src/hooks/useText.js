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
  setColor,
  setSelectedIds,
  setSelectionBox,
  emitStroke,
  emitUpdate,
  emitDelete,
  setUndoStack,
  setRedoStack,
}) => {
  // Store text input
  const [textInput, setTextInput] = useState(null);

  // Ref to textarea DOM node
  const textareaRef = useRef(null);

  // If just completed text input, prevents rendering new text box when clicked outside the box
  const justBlurredRef = useRef(false);

  // Ref to track if current click is dismissing an open text box on empty canvas
  const isDismissingRef = useRef(false);

  // Ref to track if clicking another existing text element while one is currently open
  const pendingSwitchTextRef = useRef(null);

  // Store text history as entered
  const textHistoryRef = useRef([]);

  // Ref to store index of text history
  const textHistoryIdxRef = useRef(-1);

  // Ref to track if actively editing an open text box
  const isEditingRef = useRef(false);

  // Focus and initialize text history only when text input first opens
  useEffect(() => {
    // Stores text input as it changes
    if (textInput && !isEditingRef.current) {
      isEditingRef.current = true;

      const el = textareaRef.current;
      if (el) {
        // Focus the textarea DOM node
        el.focus();
        const len = el.value.length;

        // Position the cursor at end of text
        el.setSelectionRange(len, len);

        // Initialize text history for this typing session
        textHistoryRef.current = [textInput.text || ""];
        textHistoryIdxRef.current = 0;
      }
    } else if (!textInput) {
      isEditingRef.current = false;
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
    // Clear selection box so it does not overlap with editing box
    if (setSelectedIds) setSelectedIds([]);
    if (setSelectionBox) setSelectionBox(null);

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
        fontSize:
          existingText.fontSize ||
          (existingText.size && existingText.size >= 10
            ? existingText.size
            : 24),
      });

      // Synchronize toolbar color picker with the selected text's color
      if (existingText.color) setColor(existingText.color);
    } else {
      // Empty text box
      setTextInput({
        screenX: screenPoint.x ?? screenPoint.clientX,
        screenY: screenPoint.y ?? screenPoint.clientY,
        worldX: worldPoint.x,
        worldY: worldPoint.y,
        text: "",
        color,
        fontSize: 24,
      });
    }
  };

  const handleTextPointerDown = (worldPoint) => {
    const hitOtherText = findHitText(worldPoint);

    if (hitOtherText && hitOtherText.id !== textInput?.id) {
      // Clicked another text element -> Switch directly to it on pointerup
      pendingSwitchTextRef.current = hitOtherText;
      isDismissingRef.current = false;
    } else if (!hitOtherText) {
      // Clicked empty space -> Dismiss current text box and do not open a new one
      pendingSwitchTextRef.current = null;
      isDismissingRef.current = true;
    }
  };

  const handleTextPointerUp = (e, worldPoint) => {
    // If clicked empty space -> Dismiss current text box and do not open a new one
    if (isDismissingRef.current) {
      isDismissingRef.current = false;
      return;
    }

    // If switching to another text element -> Open that element
    if (pendingSwitchTextRef.current) {
      const target = pendingSwitchTextRef.current;
      pendingSwitchTextRef.current = null;
      openTextBox(worldPoint, { x: e.clientX, y: e.clientY }, target);
      return;
    }

    // If just completed text input
    if (justBlurredRef.current) return;

    const hitText = findHitText(worldPoint);
    openTextBox(worldPoint, { x: e.clientX, y: e.clientY }, hitText);
  };

  // Double click to edit existing text element
  const handleTextDoubleClick = (worldPoint) => {
    const hitText = findHitText(worldPoint);
    if (hitText) {
      openTextBox(worldPoint, null, hitText);
      return hitText;
    }
    return null;
  };

  // Helper to get width and height
  const getWidthHeight = (text, fontSize = 24) => {
    // Caclulate no. of lines
    const lines = text.split("\n");

    const ctx = canvasRef.current.getContext("2d");
    ctx.font = `${fontSize}px sans-serif`;

    // Width of text box = Max. width of all lines
    const width = Math.max(
      ...lines.map((line) => ctx.measureText(line).width),
      20,
    );

    // Height of text box = No. of lines * Height of each line
    const height = lines.length * Math.round(fontSize * 1.25);

    return { width, height };
  };

  // Saves the text to canvas, syncs with peers and closes the text box
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
        const fontSize =
          existing?.fontSize ||
          (existing?.size && existing.size >= 10 ? existing.size : 24);
        const { width, height } = getWidthHeight(text, fontSize);

        // Updated element
        const updated = {
          ...existing,
          text,
          width,
          height,
          color,
          fontSize,
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
      const fontSize = textInput.fontSize || 24;
      const { width, height } = getWidthHeight(text, fontSize);

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
        fontSize,
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
          // Reached the start -> Close text box without undoing previous canvas stroke
          setTextInput(null);
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

    // Render the text when pressed Enter and clear text box
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
    handleTextPointerDown,
    handleTextPointerUp,
    handleTextDoubleClick,
    handleTextBlur,
    handleTextInput,
    handleTextKeyDown,
    isDismissingText: () => isDismissingRef.current,
  };
};

export default useText;
