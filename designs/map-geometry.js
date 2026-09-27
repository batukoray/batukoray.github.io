export function fitMap(worldWidth, worldHeight, maxSize = 136) {
  if (worldWidth <= 0 || worldHeight <= 0) return { width: 0, height: 0, scale: 0 };
  const scale = Math.min(maxSize / worldWidth, maxSize / worldHeight);
  return { width: worldWidth * scale, height: worldHeight * scale, scale };
}

export function projectRect(rect, scale) {
  return {
    left: rect.left * scale,
    top: rect.top * scale,
    width: rect.width * scale,
    height: rect.height * scale
  };
}

export function scrollForMapPoint(point, offset, scale, world, viewport) {
  if (scale <= 0) return { left: 0, top: 0 };
  const left = (point.x - offset.x) / scale - viewport.width / 2;
  const top = (point.y - offset.y) / scale - viewport.height / 2;
  return {
    left: Math.max(0, Math.min(world.width - viewport.width, left)),
    top: Math.max(0, Math.min(world.height - viewport.height, top))
  };
}
