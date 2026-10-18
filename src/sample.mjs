import { createDocument } from './model.mjs';

// An authored, deterministic fictional map. All artwork is drawn locally.
export function createSample() {
  const map = createDocument('Willowbend', 28, 20);
  const ground = map.layers[0].tiles, details = map.layers[1].tiles;
  for (let y = 0; y < map.height; y++) {
    const river = 17 + Math.round(Math.sin(y / 4) * 2);
    for (let x = 0; x < map.width; x++) {
      const i = y * map.width + x;
      const hash = (x * 17 + y * 31 + x * y * 7) % 97;
      ground[i] = Math.abs(x - river) <= 1 ? 3 : Math.abs(x - river) === 2 ? 4 : hash < 14 ? 2 : 1;
      if ((ground[i] === 1 || ground[i] === 2) && hash < 11) details[i] = x < 7 || y < 6 ? 7 : 8;
      if (ground[i] === 1 && hash > 91) details[i] = 10;
      if (ground[i] === 1 && hash === 72) details[i] = 9;
      if (y === 12 || (x === 9 && y >= 6 && y <= 15)) {
        if (ground[i] === 3 || ground[i] === 4) details[i] = 12;
        else { ground[i] = 5; details[i] = 0; }
      }
    }
  }
  for (const [x, y] of [[7, 8], [11, 8], [7, 15], [23, 10]]) {
    ground[y * map.width + x] = 5;
    details[y * map.width + x] = 11;
  }
  return map;
}
