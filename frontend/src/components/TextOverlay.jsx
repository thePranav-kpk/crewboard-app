import styles from "./TextOverlay.module.css";

const TextOverlay = ({
  textInput,
  textareaRef,
  theme,
  color,
  zoom = 1,
  onBlur,
  onInput,
  onKeyDown,
  handleBlur,
  handleInput,
  handleKeyDown,
}) => {
  if (!textInput) return null;

  const isNote = textInput.type === "note";

  const handleStyling = () => {
    if (isNote) {
      return {
        left: textInput.screenX,
        top: textInput.screenY,
        width: (textInput.width || 180) * zoom,
        height: (textInput.height || 180) * zoom,
        backgroundColor: textInput.color || color || "#fef08a",
        borderRadius: `${8 * zoom}px`,
        padding: `${14 * zoom}px`,
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.12)",
        fontSize: `${Math.round(20 * zoom)}px`,
        lineHeight: `${Math.round(25 * zoom)}px`,
        color: "#1e1e1e",
        boxSizing: "border-box",
        outline: "none",
        border: "none",
        whiteSpace: "pre-wrap",
      };
    }

    return {
      left: textInput.screenX,
      top: textInput.screenY,
      color:
        theme === "dark" && color === "#1e1e1e"
          ? "#ffffff"
          : theme === "light" && color === "#ffffff"
            ? "#1e1e1e"
            : color,
    };
  };

  return (
    <textarea
      ref={textareaRef}
      key={textInput.id || "new"}
      autoFocus
      defaultValue={textInput.text || ""}
      className={styles.textOverlay}
      style={handleStyling()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onBlur={onBlur || handleBlur}
      onInput={onInput || handleInput}
      onKeyDown={onKeyDown || handleKeyDown}
    />
  );
};

export default TextOverlay;
