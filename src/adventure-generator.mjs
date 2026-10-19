import { createDocument } from './model.mjs';
import { VOWS } from './adventure-perks.mjs';
export const BIOMES = Object.freeze([
  { id: 'woodland', name: 'Foxglove Wood', ground: 2, wall: 7, floor: 1 },
  { id: 'marsh', name: 'Rainmoss Fen', ground: 3, wall: 0, floor: 2 },
  { id: 'ruins', name: 'The Quiet Archive', ground: 6, wall: 9, floor: 6 },
  { id: 'dunes', name: 'Amber Hollow', ground: 4, wall: 9, floor: 4 },
]);
export const FAMILIES = Object.freeze([
  { id: 'lantern', name: 'Lost lights', brief: 'Find the scattered lanterns and scout a route to the far beacon.' },
  { id: 'relay', name: 'Signal heist', brief: 'Learn the bell order, break the signal lock, and reclaim its light.' },
  { id: 'rescue', name: 'Keeper rescue', brief: 'Restore the lamps, return for the stranded keeper, and lead them home.' },
  { id: 'courier', name: 'Singing relic', brief: 'Recover the noisy relic and carry it home. Set it down to make a false trail.' },
  { id: 'treasure', name: 'Hidden hoard', brief: 'Recover every trail coin and the hidden light before leaving.' },
  { id: 'watcher', name: 'Watcher crossing', brief: 'Break the final signal, restore its lanterns, and outmaneuver the Watcher.' },
]);
export function hashSeed(text) { let hash = 2166136261; for (const char of text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0; return hash; }
export function randomFor(seed) {
  let state = hashSeed(String(seed));
  return () => { state = (state + 0x6D2B79F5) | 0; let value = Math.imul(state ^ state >>> 15, 1 | state); value ^= value + Math.imul(value ^ value >>> 7, 61 | value); return ((value ^ value >>> 14) >>> 0) / 4294967296; };
}
function shuffled(values, random) { const result = [...values]; for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; } return result; }
export function normalizeSeed(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9 -]{0,31}$/.test(value.trim())) throw new Error('Use a seed of 1–32 letters, numbers, spaces, or hyphens.');
  return value.trim().toLowerCase().replace(/ +/g, '-');
}
export function dailySeed(date = new Date()) { if (!(date instanceof Date) || !Number.isFinite(date.valueOf())) throw new Error('Invalid daily date.'); return `daily-${date.toISOString().slice(0, 10)}`; }
export function expeditionConfig(input = {}) {
  const mode = input.mode ?? 'journey';
  if (!['journey', 'contract', 'daily'].includes(mode)) throw new Error('Choose Journey, Single contract, or Daily trail.');
  const seed = normalizeSeed(input.seed ?? 'willow-path');
  const length = mode === 'contract' ? 1 : mode === 'daily' ? 5 : Number(input.length ?? 6);
  if (![1, 3, 5, 6, 9].includes(length) || (mode === 'journey' && ![3, 6, 9].includes(length))) throw new Error('Choose a three-, six-, or nine-leg journey.');
  const difficulty = mode === 'daily' ? 'trail' : input.difficulty ?? 'trail';
  const vow = mode === 'daily' ? 'none' : input.vow ?? 'none';
  if (!['trail', 'nemesis'].includes(difficulty) || !VOWS.some(item => item.id === vow)) throw new Error('Choose known expedition rules and an oath.');
  if (mode === 'daily' && (!/^daily-\d{4}-\d{2}-\d{2}$/.test(seed) || !Number.isFinite(new Date(seed.slice(6)).valueOf()) || new Date(seed.slice(6)).toISOString().slice(0, 10) !== seed.slice(6))) throw new Error('Daily trails use a UTC date seed.');
  return { mode, seed, length, difficulty, vow };
}
export function routePreview(config, leg, path) {
  const random = randomFor(`${config.seed}|${leg}|${path}|preview`);
  const biome = BIOMES[Math.floor(random() * BIOMES.length)];
  const familyIndex = (hashSeed(config.seed) % 5 + leg + (path.endsWith('b') ? 2 : 0)) % 5;
  const family = leg === config.length - 1 && config.length > 1 ? FAMILIES[5] : FAMILIES[familyIndex];
  const bold = path.endsWith('b');
  return { biome, family, bold, bounty: bold ? 150 : 0, hunters: Math.min(3, 1 + Math.floor(leg / 3) + Number(bold)) + Number(config.difficulty === 'nemesis') };
}
export function routeChoices(config, nextLeg, path) {
  return ['s', 'b'].map(code => { const nextPath = path + code, preview = routePreview(config, nextLeg, nextPath); return { code, path: nextPath, ...preview, name: code === 's' ? 'Sheltered path' : 'Perilous path', description: code === 's' ? 'Fewer hunters; an extra shield at camp.' : 'More hunters and embers; +150 points on a win.' }; });
}

export function generateStage(input, leg = 0, path = 's') {
  const config = expeditionConfig(input);
  if (!Number.isInteger(leg) || leg < 0 || leg >= config.length || !/^[sb]+$/.test(path) || path.length !== leg + 1) throw new Error('Invalid expedition leg or route.');
  const random = randomFor(`${config.seed}|${leg}|${path}|map`), preview = routePreview(config, leg, path);
  const { biome, family, bold } = preview, columns = 5 + Number(leg >= 4), rows = 4;
  const count = columns * rows, center = index => ({ x: 3 + index % columns * 5, y: 3 + Math.floor(index / columns) * 5 });
  const neighbors = index => [index % columns ? index - 1 : -1, index % columns < columns - 1 ? index + 1 : -1, index >= columns ? index - columns : -1, index < count - columns ? index + columns : -1].filter(i => i >= 0);
  const edges = Array.from({ length: count }, () => new Set()), visited = new Set([0]), stack = [0];
  while (stack.length) {
    const current = stack.at(-1), choices = shuffled(neighbors(current).filter(i => !visited.has(i)), random);
    if (!choices.length) { stack.pop(); continue; }
    const next = choices[0]; edges[current].add(next); edges[next].add(current); visited.add(next); stack.push(next);
  }
  const roomDistances = () => {
    const values = Array(count).fill(-1), queue = [0]; values[0] = 0;
    for (const current of queue) for (const next of edges[current]) if (values[next] < 0) { values[next] = values[current] + 1; queue.push(next); }
    return values;
  };
  const treeDistances = roomDistances();
  const goal = Array.from({ length: count }, (_, i) => i).filter(i => i && edges[i].size === 1).sort((a, b) => treeDistances[b] - treeDistances[a] || a - b)[0];
  for (let current = 0; current < count; current++) for (const next of neighbors(current)) {
    if (current < next && current !== goal && next !== goal && random() < .55) { edges[current].add(next); edges[next].add(current); }
  }
  const width = columns * 5 + 2, height = rows * 5 + 2;
  const map = createDocument(`${biome.name} · ${family.name}`, width, height), ground = map.layers[0].tiles, detail = map.layers[1].tiles;
  ground.fill(biome.ground); detail.fill(biome.wall);
  const carve = (x, y, tile = biome.floor) => { ground[y * width + x] = tile; detail[y * width + x] = 0; };
  for (let room = 0; room < count; room++) {
    const p = center(room); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) carve(p.x + dx, p.y + dy);
    for (const next of edges[room]) {
      const q = center(next), dx = Math.sign(q.x - p.x), dy = Math.sign(q.y - p.y);
      for (let step = 0; step <= 5; step++) carve(p.x + step * dx, p.y + step * dy, 5);
    }
  }
  const distances = roomDistances(), outside = shuffled(Array.from({ length: count - 1 }, (_, i) => i + 1).filter(i => i !== goal), random);
  const allocated = new Set([0, goal]);
  const room = () => { const index = outside.find(i => !allocated.has(i)); if (index === undefined) throw new Error('Expedition room budget exhausted.'); allocated.add(index); return index; };
  const marker = (index, id) => ({ id, ...center(index) });
  const home = center(0), end = center(goal), homebound = family.id === 'rescue' || family.id === 'courier';
  const start = { ...home }, exit = homebound ? { x: home.x + 1, y: home.y } : { ...end };
  const gates = [], keys = [], relays = [], sequence = [], requiredRescues = [];
  const parent = [...edges[goal]][0], adjacent = center(parent), entry = { x: end.x + Math.sign(adjacent.x - end.x) * 2, y: end.y + Math.sign(adjacent.y - end.y) * 2 };
  const signal = family.id === 'relay' || family.id === 'watcher';
  if (signal) {
    gates.push({ id: 'signal-gate', type: 'signal', ...entry });
    const bellNames = shuffled(['copper', 'glass', 'iron'], random);
    for (const id of bellNames) { relays.push({ ...marker(room(), id), name: `${id[0].toUpperCase()}${id.slice(1)} bell` }); sequence.push(id); }
  } else if (family.id === 'rescue' || family.id === 'courier') {
    gates.push({ id: 'leaf-gate', type: 'key', ...entry }); keys.push(marker(room(), 'key'));
  }
  const lanternCount = family.id === 'courier' || family.id === 'treasure' ? 1 : family.id === 'lantern' ? 3 : 2;
  const lanterns = [marker(goal, 'lantern-0')];
  for (let i = 1; i < lanternCount; i++) lanterns.push(marker(room(), `lantern-${i}`));
  // Relics and rescued keepers sit in the protected room's side pockets.
  const relic = family.id === 'courier' ? { id: 'relic', x: end.x + 1, y: end.y, name: 'Singing relic' } : null;
  const rescuedName = ['Orin', 'Sola', 'Tavi', 'Jun'][Math.floor(random() * 4)];
  const clue = signal ? `Ring ${sequence.map(id => relays.find(item => item.id === id).name).join(', then ')}. A wrong note broadcasts an alarm.`
    : family.id === 'courier' ? 'The relic is behind a brass gate. It sings while carried. Press X to set it down and draw hunters away, then pick it up with E.'
      : family.id === 'rescue' ? `Find the key and restore every lamp, then return for ${rescuedName}. We leave no keeper behind.`
        : family.id === 'treasure' ? 'Every coin is part of this contract. Look in the side rooms before heading to the beacon.' : 'Scout the side rooms. A decoy buys time; a quiet fern patch hides you.';
  const guideName = ['Nia', 'Mira', 'Pip', 'Tavi'][Math.floor(random() * 4)];
  const npcs = [{ id: 'guide', name: guideName, x: home.x - 1, y: home.y, lines: [`"Welcome to ${biome.name}. ${family.brief}"`, clue], choices: [
    { id: 'decoy', label: 'Pack a spare decoy', response: `"Leave a story they will follow." One decoy packed. ${clue}`, effect: { decoys: 1 } },
    { id: 'shield', label: 'Take a shield charge', response: `"Save this for the crossing." One shield packed. ${clue}`, effect: { shields: 1 } },
  ] }];
  if (family.id === 'rescue') {
    requiredRescues.push('keeper'); npcs.push({ id: 'keeper', name: rescuedName, x: end.x + 1, y: end.y + 1,
      lines: ['"I can see the lamps from here. Bring back their light, then come back for me."'],
      after: '"You came back. I will follow your footsteps to the beacon."', choices: [] });
  }
  const coins = [], hearts = [], supplies = [], cover = [], hazards = [];
  // Corner pickups do not block corridors or duplicate quest markers.
  const coinRooms = shuffled(Array.from({ length: count }, (_, i) => i).filter(i => i !== 0), random).slice(0, 6);
  coinRooms.forEach((i, n) => { const p = center(i); coins.push({ id: `coin-${n}`, x: p.x - 1, y: p.y - 1 }); });
  for (const [n, i] of shuffled(outside, random).slice(0, 3).entries()) { const p = center(i); hearts.push({ id: `heart-${n}`, x: p.x + 1, y: p.y }); }
  for (const [n, i] of shuffled(outside, random).slice(0, 3).entries()) { const p = center(i); supplies.push({ id: `supply-${n}`, x: p.x + 1, y: p.y + 1 }); }
  for (let i = 1; i < count; i++) if (i !== goal && random() < .8) { const p = center(i); cover.push({ x: p.x - 1, y: p.y }, { x: p.x - 1, y: p.y + 1 }); }
  const hazardEdges = [];
  for (let i = 1; i < count; i++) for (const next of edges[i]) if (i < next && i !== goal && next !== goal) hazardEdges.push([i, next]);
  for (const [a, b] of shuffled(hazardEdges, random).slice(0, (bold ? 2 : 1) + Math.floor(leg / 4))) {
    const p = center(a), q = center(b), dx = Math.sign(q.x - p.x), dy = Math.sign(q.y - p.y), offset = Math.floor(random() * 4);
    for (const step of [2, 3]) hazards.push({ x: p.x + dx * step, y: p.y + dy * step, period: 4, phases: [2, 3], offset });
  }
  const spawnRooms = shuffled(Array.from({ length: count }, (_, i) => i).filter(i => i !== goal && distances[i] >= 3), random);
  const normalHunters = Math.min(3, 1 + Math.floor(leg / 3) + Number(bold));
  const hunters = Array.from({ length: normalHunters + 1 }, (_, i) => {
    const first = spawnRooms[i % spawnRooms.length], second = spawnRooms[(i + 2) % spawnRooms.length];
    return { id: `hunter-${i}`, route: [center(first), center(second)], vision: 7, boss: family.id === 'watcher' && i === 0, nemesisOnly: i === normalHunters };
  });
  const effects = [keys, lanterns, coins, hearts, supplies, relays, npcs, cover, relic ? [relic] : [], [exit]].flat();
  for (const p of effects) carve(p.x, p.y);
  const par = Math.max(70, (homebound ? 12 : 8) * (columns + rows) + lanternCount * 18 + relays.length * 15);
  const id = `exp-${hashSeed(`${config.seed}|${leg}|${path}|${config.vow}`).toString(16)}`;
  return { id, name: `${biome.name} · ${family.name}`, subtitle: `${family.name} · ${bold ? 'perilous' : 'sheltered'} route`, map,
    start, exit, par, lanterns, keys, coins, hearts, supplies, cover, hazards, hunters, npcs, relays, sequence, requiredRescues,
    gates, crates: [], plates: [], enemies: [], relic, delivery: relic ? { ...exit } : null,
    requireCoins: family.id === 'treasure' || config.vow === 'treasure', restrictions: { noDash: config.vow === 'quiet', noShield: config.vow === 'unwarded' },
    intro: `${family.brief} ${clue}`, hint: clue,
    expedition: { seed: config.seed, leg, length: config.length, path, biome: biome.id, family: family.id, bounty: preview.bounty, vow: config.vow } };
}
