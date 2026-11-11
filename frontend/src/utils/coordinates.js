// Screen -> Physical Monitor
// World -> Infinite space

// Convert physical coordinates (like a mouse click) into virtual world coordinates
// Eg:- Click coordinates on physical monitor, gets converted to virtual world coordinates to click on infinite space
const screenToWorld = (point, pan, zoom) => {
  const x_world = (point.x - pan.x) / zoom;
  const y_world = (point.y - pan.y) / zoom;

  return { x: x_world, y: y_world };
};

// Convert virtual world coordinates back into physical screen pixels for rendering
// Eg:- Draw on infinite space, gets rendered at the same place even on physical monitor
const worldToScreen = (point, pan, zoom) => {
  const x_screen = point.x * zoom + pan.x;
  const y_screen = point.y * zoom + pan.y;

  return { x: x_screen, y: y_screen };
};

// Stroke translation by (dx, dy) to move to new position
const moveStroke = (stroke, dx, dy) => {
  if (
    stroke.type === "rectangle" ||
    stroke.type === "text" ||
    stroke.type === "note"
  ) {
    // Text box is similar to rectangle

    // Moved rectangle
    return { ...stroke, x: stroke.x + dx, y: stroke.y + dy };
  }
  if (stroke.type === "circle") {
    // Moved circle
    return {
      ...stroke,
      centerX: stroke.centerX + dx,
      centerY: stroke.centerY + dy,
    };
  }
  if (stroke.type === "arrow" || stroke.type === "line") {
    // Moved arrow or line
    return {
      ...stroke,
      startX: stroke.startX + dx,
      startY: stroke.startY + dy,
      endX: stroke.endX + dx,
      endY: stroke.endY + dy,
    };
  }
  // Moved stroke
  return {
    ...stroke,
    points: stroke.points?.map((p) => ({ x: p.x + dx, y: p.y + dy })) || [],
  };
};

// Resize the elements when dragged
// Actual Bounds -> Actual Bounding box
// New Bounds -> New Bounding box
const resizeElements = (actualElements, actualBounds, newBounds) => {
  const actualWidth = actualBounds.maxX - actualBounds.minX;
  const actualHeight = actualBounds.maxY - actualBounds.minY;
  const newWidth = newBounds.maxX - newBounds.minX;
  const newHeight = newBounds.maxY - newBounds.minY;

  if (actualWidth === 0 && actualHeight === 0) return actualElements;

  const scaleX = actualWidth > 0 ? newWidth / actualWidth : 1;
  const scaleY = actualHeight > 0 ? newHeight / actualHeight : 1;

  // Normalized Factor for x = (x - minX) / width
  // New Point,x = minX + normalizedFactorX * newWidth

  // Normalized Factor for y = (y - minY) / height
  // New Point,y = minY + normalizedFactorY * newHeight

  // Mapping helpers to resize every point
  const mapX = (x) =>
    actualWidth > 0
      ? newBounds.minX + ((x - actualBounds.minX) / actualWidth) * newWidth
      : x;

  const mapY = (y) =>
    actualHeight > 0
      ? newBounds.minY + ((y - actualBounds.minY) / actualHeight) * newHeight
      : y;

  return actualElements.map((el) => {
    if (el.type === "rectangle" || el.type === "note") {
      const isNote = el.type === "note";
      return {
        ...el,
        x: mapX(el.x),
        y: mapY(el.y),
        width: isNote ? Math.max(120, el.width * scaleX) : el.width * scaleX,
        height: isNote ? Math.max(120, el.height * scaleY) : el.height * scaleY,
      };
    } else if (el.type === "text") {
      const currentFontSize =
        el.fontSize || (el.size && el.size >= 10 ? el.size : 24);
      const scale = (scaleX + scaleY) / 2;
      const newFontSize = Math.max(12, Math.round(currentFontSize * scale));
      const fontScale = newFontSize / currentFontSize;

      return {
        ...el,
        x: mapX(el.x),
        y: mapY(el.y),
        width: el.width * fontScale,
        height: el.height * fontScale,
        // Scale the font as well for text element
        fontSize: newFontSize,
      };
    } else if (el.type === "circle") {
      return {
        ...el,
        centerX: mapX(el.centerX),
        centerY: mapY(el.centerY),
        radius: Math.max(5, el.radius * ((scaleX + scaleY) / 2)),
      };
    } else if (el.type === "arrow" || el.type === "line") {
      return {
        ...el,
        startX: mapX(el.startX),
        startY: mapY(el.startY),
        endX: mapX(el.endX),
        endY: mapY(el.endY),
      };
    }
    // Resize the stroke
    return {
      ...el,
      points: el.points?.map((p) => ({ x: mapX(p.x), y: mapY(p.y) })) || [],
    };
  });
};

export { screenToWorld, worldToScreen, moveStroke, resizeElements };
