import styles from "./TextOverlay.module.css";

const TextOverlay = ({
  textInput,
  textareaRef,
  theme,
  color,
  onBlur,
  onInput,
  onKeyDown,
  handleBlur,
  handleInput,
  handleKeyDown,
}) => {
  if (!textInput) return null;

  return (
    <textarea
      ref={textareaRef}
      key={textInput.id || "new"}
      autoFocus
      defaultValue={textInput.text || ""}
      className={styles.textOverlay}
      style={{
        left: textInput.screenX,
        top: textInput.screenY,
        color:
          theme === "dark" && color === "#1e1e1e"
            ? "#ffffff"
            : theme === "light" && color === "#ffffff"
              ? "#1e1e1e"
              : color,
      }}
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
