import { createDocument } from './model.mjs';

function world(width, height, name) {
  const map = createDocument(name, width, height), ground = map.layers[0].tiles, details = map.layers[1].tiles;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x, hash = (x * 17 + y * 29 + x * y * 3) % 83;
      ground[index] = hash < 18 ? 2 : 1;
      if (hash > 76) details[index] = 10;
      if (!x || !y || x === width - 1 || y === height - 1) details[index] = hash % 3 ? 7 : 9;
    }
  }
  return map;
}

function set(map, x, y, ground = 5, detail = 0) {
  map.layers[0].tiles[y * map.width + x] = ground;
  map.layers[1].tiles[y * map.width + x] = detail;
}

function markers(points, prefix) { return points.map(([x, y], i) => ({ id: `${prefix}-${i}`, x, y })); }
function patrol(id, points) { return { id, route: points.map(([x, y]) => ({ x, y })) }; }

export function createCampaign() {
  const first = world(22, 14, 'Candlebrook');
  for (let y = 1; y < 13; y++) set(first, 12, y, 2, 7);
  for (let x = 1; x < 21; x++) if (x !== 12) set(first, x, 7);
  for (let y = 2; y < 12; y++) set(first, 4, y);
  for (let y = 2; y < 6; y++) set(first, 7, y, 2, 7);
  set(first, 12, 7); set(first, 19, 10, 6);
  const second = world(24, 16, 'Copper Crossing');
  for (let y = 1; y < 15; y++) for (let x = 11; x <= 13; x++) set(second, x, y, 3);
  for (let x = 1; x < 23; x++) if (x < 11 || x > 13) set(second, x, 8);
  for (let y = 3; y < 7; y++) set(second, 7, y, 2, 7);
  set(second, 6, 8, 6); set(second, 20, 12, 6);
  const third = world(26, 18, 'The Ember Vault');
  for (let y = 1; y < 17; y++) for (let x = 12; x <= 14; x++) set(third, x, y, 3);
  for (let x = 1; x < 25; x++) if (x < 12 || x > 14) set(third, x, 11);
  for (let y = 2; y <= 8; y++) { set(third, 18, y, 6, 9); set(third, 24, y, 6, 9); }
  for (let x = 18; x <= 24; x++) { set(third, x, 2, 6, 9); set(third, x, 8, 6, 9); }
  set(third, 18, 5); set(third, 6, 10, 6); set(third, 10, 12, 6); set(third, 21, 14, 6);
  const stages = [
    { id: 'trail-1', name: 'Candlebrook', subtitle: 'The lost lanterns', map: first, start: { x: 3, y: 7 }, exit: { x: 19, y: 10 }, par: 70,
      lanterns: markers([[3, 11], [10, 3], [18, 3]], 'lantern'), keys: markers([[4, 3]], 'key'),
      coins: markers([[3, 2], [9, 10], [15, 11], [18, 6]], 'coin'), hearts: markers([[14, 7]], 'heart'), crates: [], plates: [],
      gates: [{ id: 'brass-gate', type: 'key', x: 12, y: 7 }],
      enemies: [patrol('warden-1', [[8, 7], [9, 7], [10, 7], [11, 7]])],
      intro: 'Three lanterns have gone dark. Find the brass key, cross the gate, and bring their light to the beacon.',
      hint: 'The key is north of the starting trail. A red outlined cell shows where a warden will move next.' },
    { id: 'trail-2', name: 'Copper Crossing', subtitle: 'A weighty little puzzle', map: second, start: { x: 3, y: 8 }, exit: { x: 20, y: 12 }, par: 85,
      lanterns: markers([[4, 3], [8, 12], [20, 4]], 'lantern'), keys: [], coins: markers([[2, 2], [9, 13], [17, 3], [21, 11]], 'coin'),
      hearts: markers([[15, 8]], 'heart'), crates: [{ id: 'crate-1', x: 5, y: 8 }], plates: [{ id: 'plate-1', x: 6, y: 8 }],
      gates: [11, 12, 13].map(x => ({ id: `crossing-${x}`, type: 'bridge', x, y: 8, plates: ['plate-1'] })),
      enemies: [patrol('warden-1', [[8, 6], [8, 7], [8, 8], [8, 9]]), patrol('warden-2', [[17, 9], [18, 9], [19, 9], [20, 9]])],
      intro: 'The river crossing is asleep. Push the wooden crate onto its copper plate to hold the bridge open.',
      hint: 'Stand left of the crate and push it one tile right. Leave it on the plate, then explore both banks.' },
    { id: 'trail-3', name: 'The Ember Vault', subtitle: 'Two switches. One final light.', map: third, start: { x: 3, y: 11 }, exit: { x: 21, y: 14 }, par: 110,
      lanterns: markers([[4, 4], [9, 15], [21, 5]], 'lantern'), keys: markers([[8, 3]], 'key'),
      coins: markers([[3, 14], [8, 7], [16, 12], [22, 3]], 'coin'), hearts: markers([[16, 11]], 'heart'),
      crates: [{ id: 'crate-1', x: 5, y: 10 }, { id: 'crate-2', x: 9, y: 12 }], plates: [{ id: 'plate-1', x: 6, y: 10 }, { id: 'plate-2', x: 10, y: 12 }],
      gates: [...[12, 13, 14].map(x => ({ id: `crossing-${x}`, type: 'bridge', x, y: 11, plates: ['plate-1', 'plate-2'] })),
        { id: 'vault-gate', type: 'key', x: 18, y: 5 }],
      enemies: [patrol('warden-1', [[8, 10], [8, 11], [8, 12], [8, 13]]), patrol('warden-2', [[16, 4], [16, 5], [16, 6], [16, 7]]),
        patrol('warden-3', [[20, 4], [21, 4], [22, 4]])],
      intro: 'Two crates hold the last crossing open. Find the key, slip past the wardens, and relight the Ember Vault.',
      hint: 'Both crates need a single push east onto their plates. The brass key on the west bank opens the stone vault.' },
  ];
  for (const stage of stages) {
    for (const item of [stage.start, stage.exit, ...stage.lanterns, ...stage.keys, ...stage.coins, ...stage.hearts, ...stage.crates, ...stage.plates]) {
      stage.map.layers[1].tiles[item.y * stage.map.width + item.x] = 0;
    }
    for (const enemy of stage.enemies) for (const point of enemy.route) stage.map.layers[1].tiles[point.y * stage.map.width + point.x] = 0;
  }
  return stages;
}
