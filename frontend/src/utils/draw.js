// ctx -> Canvas API controller (acts like paintbrush)
// stroke -> JS object representing a stroke

// Helper to get color based on theme
const getColor = (stroke, theme) => {
  return theme === "dark" && stroke.color === "#1e1e1e"
    ? "#ffffff"
    : theme === "light" && stroke.color === "#ffffff"
      ? "#1e1e1e"
      : stroke.color;
};

// Helper to get line width
const getLineWidth = (stroke) => {
  return stroke.size || 4;
};

// Take a 2D Canvas context and paint a stroke object
const renderStroke = (ctx, stroke, theme) => {
  if (stroke.type === "stroke" || !stroke.type) {
    if (!stroke.points || stroke.points.length === 0) return;

    // Start a new path
    ctx.beginPath();
    ctx.strokeStyle = getColor(stroke, theme);
    ctx.lineWidth = getLineWidth(stroke);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Move to first point (acts like lifting a pen)
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    if (stroke.points.length === 1) {
      // Draw a single dot if only one point exists
      ctx.lineTo(stroke.points[0].x, stroke.points[0].y);
    } else {
      // Connect all points
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
    }

    // Paint the stroke
    ctx.stroke();
  } else if (stroke.type === "rectangle") {
    ctx.strokeStyle = getColor(stroke, theme);
    ctx.lineWidth = getLineWidth(stroke);

    // Render a rectangle (Start from (x,y) and then add width, height to form rectangle)
    ctx.strokeRect(stroke.x, stroke.y, stroke.width, stroke.height);
  } else if (stroke.type === "circle") {
    // Start a new path
    ctx.beginPath();
    ctx.strokeStyle = getColor(stroke, theme);
    ctx.lineWidth = getLineWidth(stroke);

    // Render a full circle using center coordinates and radius
    ctx.arc(stroke.centerX, stroke.centerY, stroke.radius, 0, 2 * Math.PI);

    // Paint the stroke
    ctx.stroke();
  }
};

export { renderStroke };
