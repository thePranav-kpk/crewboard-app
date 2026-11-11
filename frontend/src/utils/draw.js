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
const getTextLines = (text) => text.split("\n");

// Helper for text rendering as wrapped lines
const getWrappedLines = (ctx, text, maxWidth) => {
  const paragraphs = (text || "").split("\n");

  let wrappedLines = [];
  paragraphs.map((para) => {
    const words = para.split(" ");
    let currentLine = "";

    words.map((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (ctx.measureText(testLine).width > maxWidth) {
        wrappedLines.push(currentLine);

        // Start new line with current word
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) wrappedLines.push(currentLine);
  });

  return wrappedLines;
};

// Take a 2D Canvas context and paint a stroke object
const renderStroke = (ctx, stroke, theme) => {
  const strokeColor = getColor(stroke, theme);

  if (stroke.type === "note") {
    ctx.save();

    ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;

    ctx.fillStyle = stroke.color || "#fef08a";

    // Start a new path to draw a sticky note
    ctx.beginPath();
    ctx.roundRect(stroke.x, stroke.y, stroke.width, stroke.height, 8);
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.roundRect(stroke.x, stroke.y, stroke.width, stroke.height, 8);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const fold = 18;
    const cornerX = stroke.x + stroke.width;
    const cornerY = stroke.y + stroke.height;

    // Folded flap
    ctx.fillStyle = "rgba(0, 0, 0, 0.14)";
    ctx.beginPath();
    ctx.moveTo(cornerX - fold, cornerY);
    ctx.lineTo(cornerX - fold, cornerY - fold);
    ctx.lineTo(cornerX, cornerY - fold);
    ctx.closePath();
    ctx.fill();

    // Diagonal line
    ctx.strokeStyle = "rgba(0, 0, 0, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cornerX - fold, cornerY);
    ctx.lineTo(cornerX, cornerY - fold);
    ctx.stroke();

    const maxWidth = stroke.width - 28;
    const maxHeight = stroke.height - (stroke.author ? 44 : 28);

    const fontSizes = [20, 17, 14];

    let chosenLines = [];
    let chosenLineHeight;
    let chosenFontSize;

    // Find suitable font size and line height to render lines on sticky note
    for (const size of fontSizes) {
      chosenFontSize = size;

      const lineHeight = Math.round(size * 1.25);

      ctx.font = `${chosenFontSize}px sans-serif`;
      ctx.fillStyle = strokeColor;
      ctx.textBaseline = "top";

      const lines = getWrappedLines(ctx, stroke.text, maxWidth);

      if (lines.length * lineHeight <= maxHeight || size === 14) {
        chosenLines = lines;
        chosenLineHeight = lineHeight;
        break;
      }
    }

    ctx.font = `${chosenFontSize}px sans-serif`;
    ctx.fillStyle = "#1e1e1e";
    ctx.textBaseline = "top";

    ctx.save();
    ctx.beginPath();
    ctx.rect(stroke.x + 14, stroke.y + 14, maxWidth, maxHeight);
    ctx.clip();

    // Render lines on sticky note
    chosenLines.forEach((line, index) =>
      ctx.fillText(
        line,
        stroke.x + 14,
        stroke.y + 14 + index * chosenLineHeight,
      ),
    );

    ctx.restore();

    if (stroke.author) {
      ctx.font = "11px sans-serif";
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillText(stroke.author, stroke.x + 14, stroke.y + stroke.height - 20);
    }
    return;
  }

  if (stroke.type === "text") {
    const fontSize =
      stroke.fontSize || (stroke.size && stroke.size >= 10 ? stroke.size : 24);
    const lineHeight = Math.round(fontSize * 1.25);

    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillStyle = strokeColor;
    ctx.textBaseline = "top";

    const lines = getTextLines(stroke.text);

    // Height of each line gets increased by lineHeight
    lines.forEach((line, index) =>
      ctx.fillText(line, stroke.x, stroke.y + index * lineHeight),
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

export { renderStroke, getTextLines };
