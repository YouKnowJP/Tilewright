export const TILE_SIZE = 24;

export function drawTile(ctx, tile, x, y, size = TILE_SIZE, variant = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  const rect = (color, a, b, w, h) => { ctx.fillStyle = color; ctx.fillRect(a, b, w, h); };
  const polygon = (color, points) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b));
    ctx.closePath(); ctx.fill();
  };
  switch (tile) {
    case 0: break;
    case 1:
    case 2:
      rect(tile === 1 ? '#a4bf81' : '#80a471', 0, 0, 24, 24);
      rect(tile === 1 ? '#91ae73' : '#709563', 3 + variant % 5, 5, 2, 3);
      rect(tile === 1 ? '#b7cb91' : '#91b47f', 15, 15 - variant % 4, 3, 2);
      break;
    case 3:
      rect('#78aebe', 0, 0, 24, 24);
      rect('#8dbdca', 3 + variant % 4, 5, 8, 2);
      rect('#659eaf', 13, 16, 7, 2);
      rect('#9dc6ce', 5, 20, 3, 1);
      break;
    case 4:
      rect('#dfcf9d', 0, 0, 24, 24);
      rect('#cdbb8c', 5, 7, 2, 2); rect('#e9dcb4', 17, 15, 3, 2); break;
    case 5:
      rect('#c8b58e', 0, 0, 24, 24);
      rect('#b7a27d', 3, 18, 4, 2); rect('#dbc9a3', 13, 5, 6, 2); break;
    case 6:
      rect('#aab0a2', 0, 0, 24, 24);
      rect('#8e998d', 0, 11, 24, 1); rect('#8e998d', 10, 0, 1, 11); rect('#8e998d', 18, 12, 1, 12); break;
    case 7:
      rect('#745f44', 10, 17, 4, 6);
      polygon('#375f4c', [[2, 19], [12, 3], [22, 19]]);
      polygon('#42765b', [[3, 14], [12, 0], [21, 14]]);
      polygon('#588969', [[7, 9], [12, 1], [12, 12]]); break;
    case 8:
      rect('#796448', 10, 14, 4, 9);
      rect('#547b51', 4, 5, 17, 13); rect('#6c955c', 2, 7, 17, 8);
      rect('#7ca36a', 6, 2, 11, 9); rect('#87ad71', 5, 5, 5, 4); break;
    case 9:
      polygon('#75867b', [[3, 19], [4, 10], [9, 6], [18, 7], [22, 16], [19, 21], [7, 22]]);
      polygon('#a6b0a0', [[4, 10], [9, 6], [18, 7], [16, 14], [6, 15]]);
      rect('#bdc3b1', 8, 9, 6, 2); break;
    case 10:
      for (const [a, b] of [[5, 7], [15, 13], [7, 19]]) {
        rect('#638b58', a, b, 2, 4); rect('#e4b78e', a - 1, b - 3, 4, 4); rect('#fff0c5', a, b - 2, 2, 2);
      }
      break;
    case 11:
      rect('#a9825b', 4, 10, 17, 13); rect('#d8bd8e', 5, 11, 14, 9);
      polygon('#9c5e48', [[1, 11], [12, 1], [23, 11]]);
      polygon('#bd7958', [[1, 11], [12, 1], [12, 11]]);
      rect('#695d48', 10, 15, 4, 8); rect('#e9dfa4', 6, 13, 3, 3); rect('#e9dfa4', 16, 13, 3, 3); break;
    case 12:
      rect('#947750', 0, 2, 24, 20); rect('#c6a678', 0, 5, 24, 14);
      for (let a = 2; a < 24; a += 5) rect('#a38359', a, 5, 1, 14);
      rect('#e0bd8b', 0, 3, 24, 2); rect('#806b4e', 0, 20, 24, 2); break;
  }
  ctx.restore();
}

export function renderMap(canvas, document, { editor = false, grid = false, cursor = null, preview = null } = {}) {
  const width = document.width * TILE_SIZE, height = document.height * TILE_SIZE;
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  // Checkerboard makes empty/transparent cells visible in the editor only.
  if (editor) {
    ctx.fillStyle = '#e1e4da'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#edf0e7';
    for (let y = 0; y < height; y += 12) {
      for (let x = (y / 12 % 2) * 12; x < width; x += 24) ctx.fillRect(x, y, 12, 12);
    }
  }
  for (const layer of document.layers) {
    if (!layer.visible) continue;
    for (let y = 0; y < document.height; y++) {
      for (let x = 0; x < document.width; x++) {
        drawTile(ctx, layer.tiles[y * document.width + x], x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, x * 7 + y * 3);
      }
    }
  }
  if (grid) {
    ctx.strokeStyle = '#29482b20'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= width; x += TILE_SIZE) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, height); }
    for (let y = 0; y <= height; y += TILE_SIZE) { ctx.moveTo(0, y + .5); ctx.lineTo(width, y + .5); }
    ctx.stroke();
  }
  if (preview) {
    ctx.fillStyle = '#fff7d44f'; ctx.strokeStyle = '#fff3c9';
    for (const { x, y } of preview) ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
  if (cursor) {
    ctx.strokeStyle = '#fffbe7'; ctx.lineWidth = 2;
    ctx.strokeRect(cursor.x * TILE_SIZE + 1, cursor.y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    ctx.strokeStyle = '#31564b'; ctx.lineWidth = 1;
    ctx.strokeRect(cursor.x * TILE_SIZE + 3, cursor.y * TILE_SIZE + 3, TILE_SIZE - 6, TILE_SIZE - 6);
  }
}
