import { renderStroke } from "./draw";

// Calculate the bounds of whole content
const getContentBounds = (elements, padding = 32) => {
  if (!elements || elements.length === 0) return null;

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  for (const element of elements) {
    if (!element.points) continue;
    const radius = (element.size || 4) / 2;

    for (const stroke of element.points) {
      minX = Math.min(minX, stroke.x - radius);
      minY = Math.min(minY, stroke.y - radius);
      maxX = Math.max(maxX, stroke.x + radius);
      maxY = Math.max(maxY, stroke.y + radius);
    }
  }

  if (minX === Infinity) return null;

  // Add padding so outer strokes are also fully captured
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;

  return { minX, minY, maxX, maxY, width, height };
};

// Create in-memory canvas
const renderOffScreenCanvas = (
  elements,
  background,
  theme,
  padding = 32,
  scale = 2,
) => {
  const bounds = getContentBounds(elements, padding);
  if (!bounds) return null;

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(bounds.width * scale);
  canvas.height = Math.ceil(bounds.height * scale);

  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  let bgColor, effectiveTheme;
  if (background === "light" || background === "white") {
    bgColor = "#ffffff";
    effectiveTheme = "light";
  } else if (background === "dark") {
    bgColor = "#18181b";
    effectiveTheme = "dark";
  } else if (background === "current") {
    bgColor = theme === "dark" ? "#18181b" : "#ffffff";
    effectiveTheme = theme;
  }

  if (bgColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, bounds.width, bounds.height);
  }

  ctx.translate(padding - bounds.minX, padding - bounds.minY);

  // Render all the strokes on canvas
  elements.forEach((element) => renderStroke(ctx, element, effectiveTheme));

  return canvas;
};

const downloadCanvasImage = (
  elements,
  background,
  theme,
  filename = "crewboard.png",
) => {
  const canvas = renderOffScreenCanvas(elements, background, theme);
  if (!canvas) return false;

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = filename;
      a.click();

      URL.revokeObjectURL(url);
      resolve(true);
    }, "image/png");
  });
};

const copyCanvasToClipboard = async (elements, background, theme) => {
  const canvas = renderOffScreenCanvas(elements, background, theme);
  if (!canvas) return false;

  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      try {
        if (!blob) {
          throw new Error("Failed to create blob.");
        }

        const item = new ClipboardItem({ "image/png": blob });

        await navigator.clipboard.write([item]);
        resolve(true);
      } catch (error) {
        reject(error);
      }
    }, "image/png");
  });
};

export {
  getContentBounds,
  renderOffScreenCanvas,
  downloadCanvasImage,
  copyCanvasToClipboard,
};
