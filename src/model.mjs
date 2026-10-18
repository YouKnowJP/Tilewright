export const FORMAT = 'tilewright';
export const VERSION = 1;
export const MAX_SIZE = 64;
export const MAX_LAYERS = 6;
export const MAX_FILE_BYTES = 1_000_000;
export const TILES = Object.freeze([
  { id: 0, name: 'Empty', color: '#e7e9df', group: 'terrain' },
  { id: 1, name: 'Meadow', color: '#99b979', group: 'terrain' },
  { id: 2, name: 'Moss', color: '#6f9665', group: 'terrain' },
  { id: 3, name: 'Water', color: '#79acbc', group: 'terrain' },
  { id: 4, name: 'Sand', color: '#dfcd96', group: 'terrain' },
  { id: 5, name: 'Trail', color: '#bfac85', group: 'terrain' },
  { id: 6, name: 'Stone', color: '#a0a79c', group: 'terrain' },
  { id: 7, name: 'Pine', color: '#3e7160', group: 'objects' },
  { id: 8, name: 'Oak', color: '#668955', group: 'objects' },
  { id: 9, name: 'Boulder', color: '#8d9690', group: 'objects' },
  { id: 10, name: 'Flowers', color: '#d7a382', group: 'objects' },
  { id: 11, name: 'Cabin', color: '#b5795d', group: 'objects' },
  { id: 12, name: 'Bridge', color: '#ae8c60', group: 'objects' },
]);

export function validateDocument(input) {
  const fail = message => { throw new Error(message); };
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Expected a map object.');
  if (input.format !== FORMAT || input.version !== VERSION) fail('Unsupported map format or version.');
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 64
    || /[\u0000-\u001f\u007f]/.test(input.name)) fail('Map name must contain 1–64 printable characters.');
  if (![input.width, input.height].every(value => Number.isInteger(value) && value >= 1 && value <= MAX_SIZE)) {
    fail(`Map dimensions must be integers between 1 and ${MAX_SIZE}.`);
  }
  if (!Array.isArray(input.layers) || !input.layers.length || input.layers.length > MAX_LAYERS) {
    fail(`Maps need 1–${MAX_LAYERS} layers.`);
  }
  const ids = new Set();
  const layers = input.layers.map(layer => {
    if (!layer || typeof layer !== 'object' || typeof layer.id !== 'string'
      || !/^[a-z][a-z0-9-]{0,31}$/.test(layer.id) || ids.has(layer.id)) fail('Layer IDs must be unique simple identifiers.');
    ids.add(layer.id);
    if (typeof layer.name !== 'string' || !layer.name.trim() || layer.name.length > 32
      || /[\u0000-\u001f\u007f]/.test(layer.name)) fail('Layer names must contain 1–32 printable characters.');
    if (typeof layer.visible !== 'boolean') fail('Each layer needs a visibility setting.');
    if (!Array.isArray(layer.tiles) || layer.tiles.length !== input.width * input.height
      || Array.from(layer.tiles).some(tile => !Number.isInteger(tile) || tile < 0 || tile >= TILES.length)) {
      fail('Layer tile data is incomplete or contains an unknown tile.');
    }
    return { id: layer.id, name: layer.name.trim(), visible: layer.visible, tiles: [...layer.tiles] };
  });
  // Normalize imported objects: never retain unknown metadata or prototypes.
  return { format: FORMAT, version: VERSION, name: input.name.trim(), width: input.width, height: input.height, layers };
}

export function createDocument(name = 'Untitled world', width = 28, height = 20) {
  if (![width, height].every(value => Number.isInteger(value) && value >= 1 && value <= MAX_SIZE)) {
    throw new Error(`Map dimensions must be integers between 1 and ${MAX_SIZE}.`);
  }
  return validateDocument({ format: FORMAT, version: VERSION, name, width, height, layers: [
    { id: 'ground', name: 'Ground', visible: true, tiles: Array(width * height).fill(1) },
    { id: 'details', name: 'Details', visible: true, tiles: Array(width * height).fill(0) },
  ] });
}

export function parseDocument(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_FILE_BYTES) {
    throw new Error('Map files must be smaller than 1 MB.');
  }
  let input;
  try { input = JSON.parse(text); } catch { throw new Error('This file is not valid JSON.'); }
  return validateDocument(input);
}

export function serializeDocument(document) {
  return JSON.stringify(validateDocument(document), null, 2) + '\n';
}

export function inBounds(document, x, y) {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < document.width && y < document.height;
}

export function paintCells(document, layerId, cells, tile) {
  if (!Number.isInteger(tile) || tile < 0 || tile >= TILES.length) throw new Error('Unknown tile.');
  const layer = document.layers.find(item => item.id === layerId);
  if (!layer) throw new Error('Unknown layer.');
  const tiles = [...layer.tiles];
  let changed = false;
  for (const { x, y } of cells) {
    if (!inBounds(document, x, y)) continue;
    const index = y * document.width + x;
    if (tiles[index] !== tile) { tiles[index] = tile; changed = true; }
  }
  if (!changed) return document;
  return { ...document, layers: document.layers.map(item => item.id === layerId ? { ...item, tiles } : item) };
}

export function floodCells(document, layerId, x, y) {
  if (!inBounds(document, x, y)) return [];
  const layer = document.layers.find(item => item.id === layerId);
  if (!layer) throw new Error('Unknown layer.');
  const target = layer.tiles[y * document.width + x];
  const visited = new Set();
  const queue = [{ x, y }];
  const cells = [];
  for (let i = 0; i < queue.length; i++) {
    const cell = queue[i];
    if (!inBounds(document, cell.x, cell.y)) continue;
    const index = cell.y * document.width + cell.x;
    if (visited.has(index)) continue;
    visited.add(index);
    if (layer.tiles[index] !== target) continue;
    cells.push(cell);
    queue.push({ x: cell.x - 1, y: cell.y }, { x: cell.x + 1, y: cell.y },
      { x: cell.x, y: cell.y - 1 }, { x: cell.x, y: cell.y + 1 });
  }
  return cells;
}

export function lineCells(start, end) {
  const cells = [];
  let { x, y } = start;
  const dx = Math.abs(end.x - x), dy = -Math.abs(end.y - y);
  const sx = x < end.x ? 1 : -1, sy = y < end.y ? 1 : -1;
  let error = dx + dy;
  while (true) {
    cells.push({ x, y });
    if (x === end.x && y === end.y) break;
    const twice = 2 * error;
    if (twice >= dy) { error += dy; x += sx; }
    if (twice <= dx) { error += dx; y += sy; }
  }
  return cells;
}

export function rectangleCells(start, end) {
  const cells = [];
  for (let y = Math.min(start.y, end.y); y <= Math.max(start.y, end.y); y++) {
    for (let x = Math.min(start.x, end.x); x <= Math.max(start.x, end.x); x++) cells.push({ x, y });
  }
  return cells;
}

export class History {
  constructor(document, limit = 60) {
    if (!Number.isInteger(limit) || limit < 1) throw new Error('History limit must be positive.');
    this.document = document;
    this.limit = limit;
    this.past = [];
    this.future = [];
  }
  commit(next) {
    if (next === this.document || JSON.stringify(next) === JSON.stringify(this.document)) return false;
    this.past.push(this.document);
    if (this.past.length > this.limit) this.past.shift();
    this.document = next;
    this.future = [];
    return true;
  }
  undo() {
    if (!this.past.length) return false;
    this.future.push(this.document);
    this.document = this.past.pop();
    return true;
  }
  redo() {
    if (!this.future.length) return false;
    this.past.push(this.document);
    this.document = this.future.pop();
    return true;
  }
}
