import { TILE_SIZE } from './render.mjs';

export function fitZoom(width, height, availableWidth, availableHeight, paddingX = 0, paddingY = 0) {
  const horizontal = (availableWidth - paddingX) / (width * TILE_SIZE);
  const vertical = (availableHeight - paddingY) / (height * TILE_SIZE);
  // Round down so fractional CSS pixels cannot introduce a scrollbar in fit mode.
  return Math.max(0.001, Math.floor(Math.min(1, horizontal, vertical) * 1000) / 1000);
}

export function cellAtPoint(width, height, bounds, clientX, clientY) {
  return {
    x: Math.max(0, Math.min(width - 1, Math.floor((clientX - bounds.left) / bounds.width * width))),
    y: Math.max(0, Math.min(height - 1, Math.floor((clientY - bounds.top) / bounds.height * height))),
  };
}
