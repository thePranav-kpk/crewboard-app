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

// Helper for text rendering
const TEXT_FONT = "24px sans-serif";
const TEXT_LINE_HEIGHT = 30;
const getTextLines = (text) => text.split("\n");

// Take a 2D Canvas context and paint a stroke object
const renderStroke = (ctx, stroke, theme) => {
  const strokeColor = getColor(stroke, theme);

  if (stroke.type === "text") {
    ctx.font = TEXT_FONT;
    ctx.fillStyle = strokeColor;
    ctx.textBaseline = "top";

    const lines = getTextLines(stroke.text);

    // Height of each line gets increased by 30
    lines.forEach((line, index) =>
      ctx.fillText(line, stroke.x, stroke.y + index * TEXT_LINE_HEIGHT),
    );
    return;
  }

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = getLineWidth(stroke);

  if (stroke.type === "rectangle") {
    // Render a rectangle (Start from (x,y) and then add width, height to form rectangle)
    ctx.strokeRect(stroke.x, stroke.y, stroke.width, stroke.height);
    return;
  }

  // Start a new path
  ctx.beginPath();

  if (stroke.type === "stroke" || !stroke.type) {
    if (!stroke.points || stroke.points.length === 0) return;

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
  } else if (stroke.type === "circle") {
    // Render a full circle using center coordinates and radius
    ctx.arc(stroke.centerX, stroke.centerY, stroke.radius, 0, 2 * Math.PI);
  } else if (stroke.type === "arrow" || stroke.type === "line") {
    ctx.moveTo(stroke.startX, stroke.startY);
    ctx.lineTo(stroke.endX, stroke.endY);

    if (stroke.type === "arrow") {
      // Calculate the angle to draw the arrow head by tilting by 30 deg either side
      const angle = Math.atan2(
        stroke.endY - stroke.startY,
        stroke.endX - stroke.startX,
      );

      const headLength = stroke.size + 12;

      // From end point draw a line to one side with a negative tilt of 30 deg
      ctx.lineTo(
        stroke.endX - headLength * Math.cos(angle - Math.PI / 6),
        stroke.endY - headLength * Math.sin(angle - Math.PI / 6),
      );

      ctx.moveTo(stroke.endX, stroke.endY);

      // From end point draw a line to other side with a positive tilt of 30 deg
      ctx.lineTo(
        stroke.endX - headLength * Math.cos(angle + Math.PI / 6),
        stroke.endY - headLength * Math.sin(angle + Math.PI / 6),
      );
    }
  }

  // Paint the stroke
  ctx.stroke();
};

export { renderStroke, getTextLines, TEXT_FONT, TEXT_LINE_HEIGHT };
