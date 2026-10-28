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
  if (stroke.type === "rectangle" || stroke.type === "text") {
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

export { screenToWorld, worldToScreen, moveStroke };
