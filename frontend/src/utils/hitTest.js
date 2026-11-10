const distanceToSegment = (point, a, b) => {
  // Vector AB from A to B
  // (b.x - a.x, b.y - a.y) is vector AB
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;

  // If A and B are same points
  if (lengthSquared === 0) {
    return Math.hypot(point.x - a.x, point.y - a.y);
  }

  // Projection Factor
  // (point.x - a.x, point.y - a.y) is vector AP
  // Dot Product of AP and AB ie projection of AP on AB
  const t = ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared;

  // t<=0 -> Nearest point is A
  // t>=1 -> Nearest point is B
  // 0<t<1 -> Nearest point lies on AB

  // Clamp t between 0 and 1
  const clampedT = Math.max(0, Math.min(1, t));

  // Find nearest point
  const nearestX = a.x + clampedT * dx;
  const nearestY = a.y + clampedT * dy;

  // Square root of sum of squares of coordinates
  const distance = Math.hypot(point.x - nearestX, point.y - nearestY);

  return distance;
};

const isStrokeHit = (stroke, eraserPoint, eraserRadius = 8) => {
  const threshold = eraserRadius + (stroke.size || 4) / 2;

  if (stroke.type === "stroke" || !stroke.type) {
    if (!stroke.points || stroke.points.length === 0) return false;

    // Bounding box pre-check
    const { minX, maxX, minY, maxY } = getStrokeBounds(stroke);

    // If eraser point is completely outside this box (plus threshold), skip immediately
    if (
      eraserPoint.x < minX - threshold ||
      eraserPoint.x > maxX + threshold ||
      eraserPoint.y < minY - threshold ||
      eraserPoint.y > maxY + threshold
    ) {
      return false;
    }

    for (let i = 0; i < stroke.points.length - 1; i++) {
      // Check if eraser point intersects a stroke segment
      if (
        distanceToSegment(
          eraserPoint,
          stroke.points[i],
          stroke.points[i + 1],
        ) <= threshold
      ) {
        return true;
      }
    }

    // A and B are same points
    if (stroke.points.length == 1) {
      return (
        distanceToSegment(eraserPoint, stroke.points[0], stroke.points[0]) <=
        threshold
      );
    }
  } else if (stroke.type === "rectangle") {
    // Form coordinates for top-left, top-right, bottom-right and bottom-left corners of rectangle
    const tl = { x: stroke.x, y: stroke.y };
    const tr = { x: stroke.x + stroke.width, y: stroke.y };
    const br = { x: stroke.x + stroke.width, y: stroke.y + stroke.height };
    const bl = { x: stroke.x, y: stroke.y + stroke.height };

    // Form edges of rectangle
    const topEdge = distanceToSegment(eraserPoint, tl, tr);
    const rightEdge = distanceToSegment(eraserPoint, tr, br);
    const bottomEdge = distanceToSegment(eraserPoint, br, bl);
    const leftEdge = distanceToSegment(eraserPoint, bl, tl);

    // Check if eraser hits any of the 4 edges
    return (
      topEdge <= threshold ||
      rightEdge <= threshold ||
      bottomEdge <= threshold ||
      leftEdge <= threshold
    );
  } else if (stroke.type === "circle") {
    // Distance between eraserPoint and center
    const distance = Math.hypot(
      stroke.centerX - eraserPoint.x,
      stroke.centerY - eraserPoint.y,
    );

    // Check if absolute difference between distance and radius is within eraser radius threshold
    return Math.abs(distance - stroke.radius) <= threshold;
  } else if (stroke.type === "arrow" || stroke.type === "line") {
    // Check if distance of eraserPoint from arrow or line is within eraser radius threshold
    return (
      distanceToSegment(
        eraserPoint,
        { x: stroke.startX, y: stroke.startY },
        { x: stroke.endX, y: stroke.endY },
      ) <= threshold
    );
  } else if (stroke.type === "text") {
    // Check if eraserPoint is within text box
    return (
      stroke.x - threshold <= eraserPoint.x &&
      eraserPoint.x <= stroke.x + stroke.width + threshold &&
      stroke.y - threshold <= eraserPoint.y &&
      eraserPoint.y <= stroke.y + stroke.height + threshold
    );
  }

  return false;
};

// Get stroke boundaries
const getStrokeBounds = (stroke) => {
  if (stroke.type === "stroke" || !stroke.type) {
    if (!stroke.points || stroke.points.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
    }

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    for (const p of stroke.points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  } else if (stroke.type === "rectangle" || stroke.type === "text") {
    // Text box is similar to rectangle

    return {
      minX: stroke.x,
      maxX: stroke.x + stroke.width,
      minY: stroke.y,
      maxY: stroke.y + stroke.height,
      width: stroke.width,
      height: stroke.height,
    };
  } else if (stroke.type === "circle") {
    return {
      minX: stroke.centerX - stroke.radius,
      maxX: stroke.centerX + stroke.radius,
      minY: stroke.centerY - stroke.radius,
      maxY: stroke.centerY + stroke.radius,
      width: 2 * stroke.radius,
      height: 2 * stroke.radius,
    };
  } else if (stroke.type === "arrow" || stroke.type === "line") {
    return {
      minX: Math.min(stroke.startX, stroke.endX),
      maxX: Math.max(stroke.startX, stroke.endX),
      minY: Math.min(stroke.startY, stroke.endY),
      maxY: Math.max(stroke.startY, stroke.endY),
      width: Math.abs(stroke.startX - stroke.endX),
      height: Math.abs(stroke.startY - stroke.endY),
    };
  }
};

const getGroupBounds = (strokes) => {
  if (!strokes || strokes.length === 0) return null;

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  for (const stroke of strokes) {
    const b = getStrokeBounds(stroke);
    if (b.minX < minX) minX = b.minX;
    if (b.maxX > maxX) maxX = b.maxX;
    if (b.minY < minY) minY = b.minY;
    if (b.maxY > maxY) maxY = b.maxY;
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

// Check if any point in a stroke lies inside the selected box
const isStrokeInBox = (stroke, start, current) => {
  // Edges of selection box
  let minX = Math.min(start.x, current.x);
  let maxX = Math.max(start.x, current.x);

  let minY = Math.min(start.y, current.y);
  let maxY = Math.max(start.y, current.y);

  // If single click without drag, add tolerance padding for easy clicking
  if (Math.abs(start.x - current.x) < 4 && Math.abs(start.y - current.y) < 4) {
    const clickPad = 6;
    minX -= clickPad;
    maxX += clickPad;
    minY -= clickPad;
    maxY += clickPad;
  }

  // Handles even pen strokes
  // Edges of shape (Actually coordinates in 1D)
  const {
    minX: leftEdge,
    maxX: rightEdge,
    minY: topEdge,
    maxY: bottomEdge,
  } = getStrokeBounds(stroke);

  // Left edge of shape should be before right edge of selection box
  // Left edge of selection box should be before right edge of shape
  // Top edge of shape should be before bottom edge of selection box
  // Top edge of selection box should be before bottom edge of shape

  // Check for simultaneous intersection of X and Y axes of shape and selection box
  return (
    leftEdge <= maxX &&
    minX <= rightEdge &&
    topEdge <= maxY &&
    minY <= bottomEdge
  );
};

// Get the corner which is being dragged
const getHitHandle = (worldPoint, bounds, zoom) => {
  if (!bounds) return null;

  const pad = 6 / zoom;
  const handleRadius = 8 / zoom;

  // Define (x,y) for corners with some padding
  const handles = {
    tl: { x: bounds.minX - pad, y: bounds.minY - pad },
    tr: { x: bounds.maxX + pad, y: bounds.minY - pad },
    br: { x: bounds.maxX + pad, y: bounds.maxY + pad },
    bl: { x: bounds.minX - pad, y: bounds.maxY + pad },
  };

  for (const corner in handles) {
    // Return the corner from which worldPoint is within its distance
    if (
      Math.hypot(
        worldPoint.x - handles[corner].x,
        worldPoint.y - handles[corner].y,
      ) <= handleRadius
    )
      return corner;
  }

  return null;
};

export {
  distanceToSegment,
  isStrokeHit,
  isStrokeInBox,
  getStrokeBounds,
  getGroupBounds,
  getHitHandle,
};
