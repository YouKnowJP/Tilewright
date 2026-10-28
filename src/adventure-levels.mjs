import { createDocument } from './model.mjs';
import { createSluiceSaga } from './adventure-sluice-levels.mjs';
import { createHorizonSaga } from './adventure-horizon-levels.mjs';
import { createAtlasSaga } from './adventure-atlas-levels.mjs';
import { CHAPTERS } from './adventure-art.mjs';
export const CAMPAIGN_IDS = Object.freeze(Array.from({ length: 24 }, (_, index) => `trail-${index + 1}`));

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
  stages[0].npcs = [guide('mira', 'Mira', 2, 7, 'A trail keeper is packing a bag beside the path.', 'Wardens show their next step in red. A dash crosses two cells before they move.')];
  stages[1].npcs = [guide('tavi', 'Tavi', 2, 8, 'The bridge keeper points at the copper plate.', 'Leave the crate on the plate. If you push it too far, approach from the other side.')];
  stages[2].npcs = [guide('mira', 'Mira', 2, 11, 'Mira lowers her voice. Something beyond the vault has started watching the trails.', 'Both plates need crates. Find the west-bank key before entering the vault.')];
  stages.push(...createContracts());
  stages[5].actFinal = true; stages[5].nemesisStart = 3;
  stages.push(...createSluiceSaga());
  stages.push(...createAtlasSaga());
  stages.push(...createHorizonSaga());
  stages.forEach((stage, index) => { stage.chapter = Math.floor(index / 3); stage.theme = CHAPTERS[stage.chapter].id; });
  for (const stage of stages) {
    for (const item of [stage.start, stage.exit, ...stage.lanterns, ...stage.keys, ...stage.coins, ...stage.hearts, ...stage.crates, ...stage.plates, ...(stage.npcs || []), ...(stage.relays || []), ...(stage.supplies || []), ...(stage.cover || []), ...(stage.switches || []), ...(stage.relic ? [stage.relic] : [])]) {
      stage.map.layers[1].tiles[item.y * stage.map.width + item.x] = 0;
    }
    for (const hunter of stage.hunters || []) for (const point of hunter.route) stage.map.layers[1].tiles[point.y * stage.map.width + point.x] = 0;
    for (const enemy of stage.enemies) for (const point of enemy.route) stage.map.layers[1].tiles[point.y * stage.map.width + point.x] = 0;
  }
  return stages;
}

function guide(id, name, x, y, opening, clue) {
  return { id, name, x, y, lines: [opening, clue], choices: [
    { id: 'decoy', label: 'Pack an extra decoy', response: `"Give them a false trail." You receive one decoy. ${clue}`, effect: { decoys: 1 } },
    { id: 'shield', label: 'Take a shield charge', response: `"Save it for the dangerous crossing." You receive one shield. ${clue}`, effect: { shields: 1 } },
  ] };
}
function patch(x, y) { return [{ x, y }, { x: x + 1, y }, { x, y: y + 1 }, { x: x + 1, y: y + 1 }]; }
function hunter(id, points, boss = false) { return { ...patrol(id, points), boss, vision: boss ? 9 : 7 }; }
function ember(x, y, offset = 0) { return { x, y, period: 4, phases: [2, 3], offset }; }
function relay(id, name, x, y) { return { id, name, x, y }; }
function frame(map, left, top, right, bottom, opening) {
  for (let y = top; y <= bottom; y++) { set(map, left, y, 6, 9); set(map, right, y, 6, 9); }
  for (let x = left; x <= right; x++) { set(map, x, top, 6, 9); set(map, x, bottom, 6, 9); }
  set(map, opening.x, opening.y, 6);
}
function createContracts() {
  const rescue = world(26, 18, 'Briarwatch Rescue');
  for (let y = 1; y < 17; y++) set(rescue, 14, y, 2, 7);
  for (let x = 1; x < 25; x++) if (x !== 14) set(rescue, x, 8);
  set(rescue, 14, 8);
  for (let y = 4; y <= 6; y++) set(rescue, 8, y, 2, 7);
  for (let y = 10; y <= 12; y++) set(rescue, 8, y, 2, 7);
  const heist = world(28, 20, 'Bellforge Heist');
  for (let y = 1; y < 19; y++) set(heist, 14, y, 6, 9);
  for (let x = 1; x < 27; x++) if (x !== 14) set(heist, x, 10);
  set(heist, 14, 10, 6);
  for (let y = 5; y <= 8; y++) set(heist, 8, y, 6, 9);
  for (let y = 12; y <= 15; y++) set(heist, 8, y, 6, 9);
  const crown = world(32, 22, 'The Watcher’s Crown');
  for (let y = 1; y < 21; y++) for (let x = 15; x <= 17; x++) set(crown, x, y, 3);
  for (let x = 1; x < 31; x++) if (x < 15 || x > 17) set(crown, x, 12);
  frame(crown, 23, 3, 30, 10, { x: 23, y: 7 }); frame(crown, 24, 14, 30, 20, { x: 24, y: 17 });
  const orin = { id: 'orin', name: 'Orin', x: 21, y: 4,
    lines: ['"The lamps keep the forest paths open. I cannot get home until all three are lit."', 'Restore the lanterns, then return and speak to me before leaving.'],
    after: '"I can see the way home! Meet me at the turquoise beacon. And do not walk the same route twice."',
    choices: [{ id: 'promise', label: 'I will bring back the light', response: '"The hunters watch straight runs. Hide in the fern patches; a false lantern will draw them away."' }] };
  const sola = { id: 'sola', name: 'Sola', x: 26, y: 8,
    lines: ['"The Watcher gets sharper with every lantern. Ring Moon, Root, then Sun to break its signal."', 'Restore all lanterns and come back for me. The beacon chamber opens when the relays are complete.'],
    after: '"The signal is broken. I am right behind you. Get us to the beacon!"',
    choices: [{ id: 'rescue', label: 'We are getting out together', response: '"Use the shield before crossing embers. A decoy buys five turns. The Watcher must commit to the outlined step."' }] };
  return [
    { id: 'trail-4', name: 'Briarwatch Rescue', subtitle: 'Rescue contract · adaptive hunters', contractStart: true, map: rescue,
      start: { x: 3, y: 8 }, exit: { x: 3, y: 14 }, par: 105,
      lanterns: markers([[5, 3], [11, 14], [22, 12]], 'lantern'), keys: markers([[10, 3]], 'key'),
      coins: markers([[5, 15], [12, 2], [18, 14], [23, 3]], 'coin'), hearts: markers([[7, 3], [18, 12]], 'heart'),
      gates: [{ id: 'briar-gate', type: 'key', x: 14, y: 8 }], crates: [], plates: [], enemies: [],
      hunters: [hunter('tracker', [[10, 8], [10, 12]]), hunter('sentry', [[21, 8], [21, 13]]), { ...hunter('ranger', [[18, 4], [18, 10]]), nemesisOnly: true }],
      npcs: [guide('nia', 'Nia', 2, 8, '"Orin is trapped on the far bank. These wardens have learned to follow us."', 'Pick up the north-bank key, restore three lanterns, then speak to Orin in the northeast. Fern patches hide quiet movement.'), orin],
      requiredRescues: ['orin'], cover: [...patch(6, 6), ...patch(9, 10), ...patch(18, 6), ...patch(18, 13)],
      supplies: markers([[7, 14], [22, 15]], 'supply'),
      intro: 'Rescue Orin from the forest. Adaptive hunters anticipate repeated moves. Break their sight, change your rhythm, and restore the lamps.',
      hint: 'Get the key at the north end of the west bank. Talk to Orin after restoring all three lanterns. Use cover and decoys to cross the hunters’ routes.' },
    { id: 'trail-5', name: 'Bellforge Heist', subtitle: 'Signal puzzle · cycling embers', map: heist,
      start: { x: 3, y: 10 }, exit: { x: 24, y: 16 }, par: 110,
      lanterns: markers([[4, 15], [10, 3], [24, 5]], 'lantern'), keys: [], crates: [], plates: [], enemies: [],
      coins: markers([[2, 3], [12, 17], [18, 4], [25, 17]], 'coin'), hearts: markers([[11, 11], [22, 14]], 'heart'),
      gates: [{ id: 'signal-gate', type: 'signal', x: 14, y: 10 }],
      relays: [relay('copper', 'Copper bell', 5, 4), relay('glass', 'Glass bell', 10, 15), relay('iron', 'Iron bell', 11, 4)], sequence: ['copper', 'glass', 'iron'],
      hunters: [hunter('listener', [[10, 10], [10, 14]]), hunter('forge-guard', [[22, 10], [22, 15]]), { ...hunter('bell-guard', [[20, 4], [24, 4]]), nemesisOnly: true }],
      npcs: [guide('pip', 'Pip', 3, 9, '"The bells are a lock. Get the tune wrong and every hunter will hear."', 'Ring Copper, then Glass, then Iron. Orange outlines warn of the next ember pulse. The completed sequence briefly stuns hunters.')],
      cover: [...patch(5, 7), ...patch(10, 12), ...patch(17, 12), ...patch(23, 14)],
      hazards: [...[18, 19, 20, 21, 22, 23].map(x => ember(x, 10)), ...[6, 7, 8, 9].map(y => ember(23, y, 1))],
      supplies: markers([[12, 10], [20, 15]], 'supply'),
      intro: 'Break Bellforge’s signal lock. Find the bell order, steal back its lantern light, and cross the ember fields while hunters listen.',
      hint: 'Pip knows the bell order. Stand beside a bell and Interact. Wrong notes reset the sequence and sound an alarm. Step around embers or shield before crossing.' },
    { id: 'trail-6', name: 'The Watcher’s Crown', subtitle: 'Finale · three-phase Watcher', map: crown,
      start: { x: 3, y: 12 }, exit: { x: 28, y: 17 }, par: 135,
      lanterns: markers([[4, 17], [12, 4], [27, 7]], 'lantern'), keys: markers([[9, 6]], 'key'),
      coins: markers([[4, 3], [12, 19], [20, 4], [29, 12]], 'coin'), hearts: markers([[13, 9], [21, 15]], 'heart'),
      crates: [{ id: 'crate-1', x: 6, y: 11 }, { id: 'crate-2', x: 10, y: 13 }], plates: [{ id: 'plate-1', x: 7, y: 11 }, { id: 'plate-2', x: 11, y: 13 }],
      gates: [...[15, 16, 17].map(x => ({ id: `crown-bridge-${x}`, type: 'bridge', x, y: 12, plates: ['plate-1', 'plate-2'] })),
        { id: 'crown-key', type: 'key', x: 23, y: 7 }, { id: 'crown-signal', type: 'signal', x: 24, y: 17 }],
      relays: [relay('moon', 'Moon bell', 5, 4), relay('root', 'Root bell', 12, 17), relay('sun', 'Sun bell', 26, 5)], sequence: ['moon', 'root', 'sun'],
      hunters: [hunter('watcher', [[24, 12], [28, 12]], true), hunter('outrider', [[11, 10], [11, 15]]), { ...hunter('crown-guard', [[20, 15], [22, 18]]), nemesisOnly: true }], enemies: [],
      npcs: [guide('nia', 'Nia', 2, 12, '"This is the heart of the signal. The Watcher is waiting for your favorite move."', 'Push both crates east onto their plates. Ring Moon, Root, Sun. Every lantern advances the Watcher’s phase; rescue Sola in the vault before leaving.'), sola],
      requiredRescues: ['sola'], cover: [...patch(6, 8), ...patch(11, 15), ...patch(19, 8), ...patch(20, 14)],
      hazards: [...[19, 20, 21, 22].map(x => ember(x, 12)), ...[26, 27, 28].map(x => ember(x, 13, 1))],
      supplies: markers([[12, 12], [21, 8]], 'supply'),
      intro: 'Silence the Watcher, rescue Sola, and escape. Two crate locks, a brass gate, ordered relays, ember pulses, and a hunter that grows sharper with every light.',
      hint: 'Nia knows the relay order. Both crates need one push east. Use the west-bank key at the vault, then ring its Sun bell after Moon and Root. Return for Sola once all lights are restored.' },
  ];
}
