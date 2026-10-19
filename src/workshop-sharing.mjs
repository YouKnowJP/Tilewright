import { ADVENTURE_FORMAT, MAX_ADVENTURE_BYTES, normalizeAdventure } from './workshop-model.mjs';
export const MAX_SHARE_CODE = 300_000, MAX_PLAY_LINK = 12_000;
export function encodeRuns(tiles) {
  const result = [];
  for (let i = 0; i < tiles.length;) { let end = i + 1; while (end < tiles.length && tiles[end] === tiles[i]) end++; result.push(tiles[i], end - i); i = end; }
  return result;
}
export function decodeRuns(runs, count) {
  if (!Array.isArray(runs) || runs.length > count * 2 || runs.length % 2) throw Error('The shared terrain data is invalid.');
  const tiles = [];
  for (let i = 0; i < runs.length; i += 2) {
    const tile = runs[i], length = runs[i + 1];
    if (!Number.isInteger(tile) || tile < 0 || tile > 12 || !Number.isInteger(length) || length < 1 || length > count - tiles.length) throw Error('The shared terrain data exceeds its map bounds.');
    for (let n = 0; n < length; n++) tiles.push(tile);
  }
  if (tiles.length !== count) throw Error('The shared terrain data is incomplete.');
  return tiles;
}
export function serializeAdventure(input) {
  const pack = normalizeAdventure(input);
  const json = JSON.stringify({ ...pack, encoding: 'rle-v1', map: { ...pack.map, layers: pack.map.layers.map(({ tiles, ...layer }) => ({ ...layer, runs: encodeRuns(tiles) })) } }) + '\n';
  if (new TextEncoder().encode(json).length > MAX_ADVENTURE_BYTES) throw Error('This adventure exceeds the 400 KB file limit. Shorten dialogue, simplify terrain, or record a shorter creator clear.');
  return json;
}
export function parseAdventure(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_ADVENTURE_BYTES) throw Error('Choose an adventure file smaller than 400 KB.');
  let input; try { input = JSON.parse(text); } catch { throw Error('The adventure file is not valid JSON.'); }
  if (!input || input.format !== ADVENTURE_FORMAT || input.version !== 1) throw Error('Choose a Tilewright adventure file, rather than a terrain-only map.');
  if (input.encoding !== undefined) {
    if (input.encoding !== 'rle-v1' || !Number.isInteger(input.map?.width) || !Number.isInteger(input.map?.height) || input.map.width < 1 || input.map.height < 1 || input.map.width > 64 || input.map.height > 64
      || !Array.isArray(input.map.layers) || input.map.layers.length < 1 || input.map.layers.length > 6) throw Error('This adventure uses unsupported terrain encoding or dimensions.');
    input.map = { ...input.map, layers: input.map.layers.map(layer => ({ ...layer, tiles: decodeRuns(layer.runs, input.map.width * input.map.height) })) };
  }
  return normalizeAdventure(input);
}
function checksum(bytes) { let hash = 2166136261; for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619) >>> 0; return hash.toString(16).padStart(8, '0'); }
export function adventureCode(pack) {
  const bytes = new TextEncoder().encode(serializeAdventure(pack));
  let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte);
  const code = `LT1.${checksum(bytes)}.${btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')}`;
  if (code.length > MAX_SHARE_CODE) throw Error('This detailed adventure is too large for a code. Download its adventure file instead.');
  return code;
}
export function parseAdventureCode(value) {
  if (typeof value !== 'string' || value.length > MAX_SHARE_CODE + 200) throw Error('The adventure code is too long. Import the adventure file instead.');
  const raw = value.trim(), code = raw.includes('#adventure=') ? raw.slice(raw.indexOf('#adventure=') + 11) : raw;
  const match = /^LT1\.([0-9a-f]{8})\.([A-Za-z0-9_-]+)$/.exec(code);
  if (!match || code.length > MAX_SHARE_CODE) throw Error('Paste a complete LT1 adventure code or a Tilewright play link.');
  let bytes;
  try { bytes = Uint8Array.from(atob(match[2].replaceAll('-', '+').replaceAll('_', '/')), character => character.charCodeAt(0)); } catch { throw Error('The adventure code is incomplete. Ask for a fresh copy.'); }
  if (bytes.length > MAX_ADVENTURE_BYTES || checksum(bytes) !== match[1]) throw Error('The adventure code is incomplete or has changed. Ask for a fresh copy.');
  return parseAdventure(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}
export function adventurePlayLink(pack, location) {
  const url = new URL(location);
  if (!['https:', 'http:'].includes(url.protocol) || ['localhost', '127.0.0.1', '[::1]', '::1', '0.0.0.0'].includes(url.hostname) || /^(?:127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(url.hostname)) throw Error('Share a code or adventure file from this local copy. Play links are available when the game is hosted online.');
  const code = adventureCode(pack); if (code.length > MAX_PLAY_LINK) throw Error('This world is too detailed for a play link. Share its code or adventure file instead.');
  url.search = ''; url.hash = `adventure=${code}`; return url.href;
}
