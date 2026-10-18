import { MAX_LAYERS, MAX_SIZE, TILES, validateDocument } from './model.mjs';

export const ANCHORS = Object.freeze([
  'top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right',
]);

function layerIndex(document, id) {
  const index = document.layers.findIndex(layer => layer.id === id);
  if (index === -1) throw new Error('Unknown layer.');
  return index;
}

export function renameLayer(document, id, name) {
  const index = layerIndex(document, id);
  const result = validateDocument({ ...document,
    layers: document.layers.map((layer, i) => i === index ? { ...layer, name } : layer) });
  return result.layers[index].name === document.layers[index].name ? document : result;
}

export function duplicateLayer(document, id) {
  const index = layerIndex(document, id);
  if (document.layers.length >= MAX_LAYERS) throw new Error(`Maps can contain at most ${MAX_LAYERS} layers.`);
  let suffix = 1;
  while (document.layers.some(layer => layer.id === `layer-${suffix}`)) suffix++;
  const source = document.layers[index];
  const copy = { ...source, id: `layer-${suffix}`, name: `${source.name.slice(0, 27)} copy`, tiles: [...source.tiles] };
  const layers = [...document.layers]; layers.splice(index + 1, 0, copy);
  return { ...document, layers };
}

export function moveLayer(document, id, direction) {
  const index = layerIndex(document, id);
  if (direction !== 1 && direction !== -1) throw new Error('Layer movement must be one position up or down.');
  const target = index + direction;
  if (target < 0 || target >= document.layers.length) return document;
  const layers = [...document.layers];
  [layers[index], layers[target]] = [layers[target], layers[index]];
  return { ...document, layers };
}

export function removeLayer(document, id) {
  layerIndex(document, id);
  if (document.layers.length <= 1) throw new Error('Keep at least one layer in the map.');
  return { ...document, layers: document.layers.filter(layer => layer.id !== id) };
}

function resizeOffset(document, width, height, anchor) {
  if (![width, height].every(value => Number.isInteger(value) && value >= 1 && value <= MAX_SIZE)) {
    throw new Error(`Map dimensions must be integers between 1 and ${MAX_SIZE}.`);
  }
  if (!ANCHORS.includes(anchor)) throw new Error('Choose a valid resize anchor.');
  const index = ANCHORS.indexOf(anchor), horizontal = index % 3, vertical = Math.floor(index / 3);
  const offset = (difference, position) => position === 0 ? 0 : position === 1 ? Math.floor(difference / 2) : difference;
  return { x: offset(width - document.width, horizontal), y: offset(height - document.height, vertical) };
}

export function croppedTileCount(document, width, height, anchor = 'top-left') {
  const offset = resizeOffset(document, width, height, anchor);
  let count = 0;
  for (const layer of document.layers) {
    for (let y = 0; y < document.height; y++) {
      for (let x = 0; x < document.width; x++) {
        const outside = x + offset.x < 0 || y + offset.y < 0 || x + offset.x >= width || y + offset.y >= height;
        if (outside && layer.tiles[y * document.width + x] !== 0) count++;
      }
    }
  }
  return count;
}

export function resizeDocument(document, width, height, { anchor = 'top-left', fillTile = 0 } = {}) {
  const offset = resizeOffset(document, width, height, anchor);
  if (!Number.isInteger(fillTile) || fillTile < 0 || fillTile >= TILES.length) throw new Error('Choose a valid fill tile.');
  if (document.width === width && document.height === height) return document;
  const layers = document.layers.map((layer, index) => {
    const tiles = Array(width * height).fill(index === 0 ? fillTile : 0);
    for (let y = 0; y < document.height; y++) {
      for (let x = 0; x < document.width; x++) {
        const targetX = x + offset.x, targetY = y + offset.y;
        if (targetX >= 0 && targetY >= 0 && targetX < width && targetY < height) {
          tiles[targetY * width + targetX] = layer.tiles[y * document.width + x];
        }
      }
    }
    return { ...layer, tiles };
  });
  return { ...document, width, height, layers };
}
