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

export { screenToWorld, worldToScreen };
