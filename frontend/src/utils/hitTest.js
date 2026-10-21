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
  if (!stroke.points || stroke.points.length === 0) return false;

  const threshold = eraserRadius + (stroke.size || 4) / 2;

  // Bounding box pre-check
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
      distanceToSegment(eraserPoint, stroke.points[i], stroke.points[i + 1]) <=
      threshold
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

  return false;
};

export { distanceToSegment, isStrokeHit };
