// ctx -> Canvas API controller (acts like paintbrush)
// stroke -> JS object representing a stroke

// Take a 2D Canvas context and paint a stroke object
const renderStroke = (ctx, stroke) => {
  if (!stroke.points || stroke.points.length === 0) return;

  // Start a new path
  ctx.beginPath();
  ctx.strokeStyle = stroke.color || "#000000";
  ctx.lineWidth = stroke.size || 4;
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
};

export { renderStroke };
