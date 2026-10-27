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
  if (stroke.type === "stroke" || !stroke.type) {
    if (!stroke.points || stroke.points.length === 0) return false;

    const threshold = eraserRadius + (stroke.size || 4) / 2;

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

    const threshold = eraserRadius + (stroke.size || 4) / 2;

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
  } else if (stroke.type === "rectangle") {
    return {
      minX: stroke.x,
      maxX: stroke.x + stroke.width,
      minY: stroke.y,
      maxY: stroke.y + stroke.height,
      width: stroke.width,
      height: stroke.height,
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
  const minX = Math.min(start.x, current.x);
  const maxX = Math.max(start.x, current.x);

  const minY = Math.min(start.y, current.y);
  const maxY = Math.max(start.y, current.y);

  if (stroke.type === "stroke" || !stroke.type) {
    for (const p of stroke.points) {
      if (p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY) return true;
    }
  } else if (stroke.type === "rectangle") {
    // Edges of rectangle (Actually coordinates in 1D)
    const leftEdge = stroke.x;
    const rightEdge = stroke.x + stroke.width;
    const topEdge = stroke.y;
    const bottomEdge = stroke.y + stroke.height;

    // Check for simultaneous intersection of X and Y axes of rectangle and selection box
    return (
      leftEdge <= maxX &&
      minX <= rightEdge &&
      topEdge <= maxY &&
      minY <= bottomEdge
    );
  }

  return false;
};

export {
  distanceToSegment,
  isStrokeHit,
  isStrokeInBox,
  getStrokeBounds,
  getGroupBounds,
};
