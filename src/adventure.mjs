import { validateDocument } from './model.mjs';

export const DIRECTIONS = Object.freeze({ up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] });
export const MAX_HEARTS = 3;
export const MAX_ENERGY = 3;
const same = (a, b) => a.x === b.x && a.y === b.y;
const inside = (map, point) => point.x >= 0 && point.y >= 0 && point.x < map.width && point.y < map.height;

export function walkableCells(document) {
  const cells = Array(document.width * document.height).fill(false);
  for (const layer of document.layers) {
    if (!layer.visible) continue;
    layer.tiles.forEach((tile, index) => {
      if (tile >= 1 && tile <= 6) cells[index] = tile !== 3;
      else if ([7, 8, 9, 11].includes(tile)) cells[index] = false;
      else if (tile === 12) cells[index] = true;
      // Flowers do not make underlying water or empty space walkable.
    });
  }
  return cells;
}

export function activePlates(run) {
  return run.stage.plates.filter(plate => same(plate, run.player) || run.crates.some(crate => same(crate, plate))).map(plate => plate.id);
}

export function gateIsOpen(run, gate) {
  if (gate.type === 'key') return run.openGates.includes(gate.id);
  const active = activePlates(run);
  return gate.plates.every(id => active.includes(id));
}

export function canEnter(run, point, unlock = false) {
  if (!inside(run.stage.map, point)) return false;
  const gate = run.stage.gates.find(item => same(item, point));
  if (gate) {
    if (gate.type === 'bridge') return gateIsOpen(run, gate);
    if (!gateIsOpen(run, gate) && !(unlock && run.keyCount > 0)) return false;
  }
  return run.walkable[point.y * run.stage.map.width + point.x];
}

function reveal(run, point) {
  const { width, height } = run.stage.map;
  for (let y = Math.max(0, point.y - 5); y <= Math.min(height - 1, point.y + 5); y++) {
    for (let x = Math.max(0, point.x - 5); x <= Math.min(width - 1, point.x + 5); x++) {
      if ((x - point.x) ** 2 + (y - point.y) ** 2 <= 30) run.seen[y * width + x] = true;
    }
  }
}

export function createRun(definition) {
  const map = validateDocument(definition.map);
  const stage = { ...definition, map };
  for (const name of ['lanterns', 'keys', 'coins', 'hearts', 'crates', 'plates', 'gates', 'enemies']) {
    stage[name] = structuredClone(definition[name] || []);
  }
  if (!stage.start || !stage.exit || !stage.lanterns.length) throw new Error('An adventure needs a start, a beacon, and at least one lantern.');
  const points = [stage.start, stage.exit, ...stage.lanterns, ...stage.keys, ...stage.coins, ...stage.hearts,
    ...stage.crates, ...stage.plates, ...stage.gates, ...stage.enemies.flatMap(enemy => enemy.route)];
  if (points.some(point => !point || !Number.isInteger(point.x) || !Number.isInteger(point.y) || !inside(map, point))) {
    throw new Error('Adventure markers must be inside the map.');
  }
  if (stage.gates.some(gate => !['key', 'bridge'].includes(gate.type)
    || (gate.type === 'bridge' && (!gate.plates?.length || gate.plates.some(id => !stage.plates.some(plate => plate.id === id)))))) {
    throw new Error('Adventure gates need valid keys or pressure plates.');
  }
  if (stage.enemies.some(enemy => enemy.route.length < 2
    || enemy.route.some((point, index) => index && Math.abs(point.x - enemy.route[index - 1].x) + Math.abs(point.y - enemy.route[index - 1].y) !== 1))) {
    throw new Error('Patrol routes must connect adjacent cells.');
  }
  const run = {
    stage, walkable: walkableCells(map), player: { ...stage.start }, facing: 'down',
    crates: stage.crates.map(crate => ({ ...crate })),
    enemies: stage.enemies.map(enemy => ({ ...enemy, index: 0, direction: 1 })),
    collectedLanterns: [], collectedKeys: [], collectedCoins: [], collectedHearts: [], openGates: [],
    keyCount: 0, health: MAX_HEARTS, energy: MAX_ENERGY, turns: 0, damage: 0, invulnerability: 0,
    status: 'playing', seen: Array(map.width * map.height).fill(false), events: [], message: stage.intro || 'Find the lanterns, then return to the beacon.',
  };
  if (!canEnter(run, run.player) || stage.crates.some(crate => same(crate, run.player))) throw new Error('The starting cell is blocked.');
  reveal(run, run.player);
  return run;
}

function collect(run) {
  for (const [items, collection, type] of [
    ['lanterns', 'collectedLanterns', 'lantern'], ['keys', 'collectedKeys', 'key'],
    ['coins', 'collectedCoins', 'coin'], ['hearts', 'collectedHearts', 'heart'],
  ]) {
    const item = run.stage[items].find(candidate => same(candidate, run.player) && !run[collection].includes(candidate.id));
    if (!item || (type === 'heart' && run.health === MAX_HEARTS)) continue;
    run[collection].push(item.id); run.events.push({ type, x: item.x, y: item.y });
    if (type === 'key') run.keyCount++;
    if (type === 'heart') run.health = Math.min(MAX_HEARTS, run.health + 1);
  }
}

export function enemyIntent(run, enemy) {
  let direction = enemy.direction, index = enemy.index + direction;
  if (index < 0 || index >= enemy.route.length) { direction *= -1; index = enemy.index + direction; }
  const target = enemy.route[index];
  if (!canEnter(run, target) || run.crates.some(crate => same(crate, target))) return { index: enemy.index, direction: -direction, point: enemy.route[enemy.index] };
  return { index, direction, point: target };
}

function blockMessage(run, point) {
  const gate = run.stage.gates.find(item => same(item, point));
  if (gate?.type === 'key' && !gateIsOpen(run, gate)) return 'A locked gate. Find a key first.';
  if (gate?.type === 'bridge') return 'The crossing is closed. Leave crates on every linked pressure plate.';
  return 'That way is blocked. Trees, rocks, cabins, and deep water need a different route.';
}

export function stepRun(run, action) {
  if (run.status !== 'playing' || typeof action !== 'string') return run;
  const dash = action.startsWith('dash-'), direction = dash ? action.slice(5) : action;
  if (direction !== 'wait' && !DIRECTIONS[direction]) return run;
  if (dash && (direction === 'wait' || run.energy < 2)) return { ...run, events: [], message: 'Dash needs two energy. Walk or wait to recharge.' };
  const next = { ...run, player: { ...run.player }, crates: run.crates.map(crate => ({ ...crate })),
    enemies: run.enemies.map(enemy => ({ ...enemy })),
    collectedLanterns: [...run.collectedLanterns], collectedKeys: [...run.collectedKeys],
    collectedCoins: [...run.collectedCoins], collectedHearts: [...run.collectedHearts],
    openGates: [...run.openGates], seen: [...run.seen], events: [], invulnerability: Math.max(0, run.invulnerability - 1) };
  let moved = false, touchedEnemy = false, blocked = '';
  if (direction !== 'wait') {
    const [dx, dy] = DIRECTIONS[direction]; next.facing = direction;
    for (let distance = 0; distance < (dash ? 2 : 1); distance++) {
      const point = { x: next.player.x + dx, y: next.player.y + dy };
      if (!canEnter(next, point, true)) { blocked = blockMessage(next, point); break; }
      const crate = next.crates.find(item => same(item, point));
      if (crate) {
        const destination = { x: point.x + dx, y: point.y + dy };
        if (!canEnter(next, destination) || next.crates.some(item => same(item, destination))) { blocked = 'The crate cannot move that way. Try pushing from another side.'; break; }
        crate.x = destination.x; crate.y = destination.y;
        next.events.push({ type: 'push', x: crate.x, y: crate.y });
      }
      const gate = next.stage.gates.find(item => same(item, point));
      if (gate?.type === 'key' && !gateIsOpen(next, gate)) {
        next.keyCount--; next.openGates.push(gate.id); next.events.push({ type: 'unlock', ...point });
      }
      next.player = point; moved = true;
      touchedEnemy ||= next.enemies.some(enemy => same(enemy.route[enemy.index], point));
      collect(next); reveal(next, point);
      // The beacon is a destination, not a tile to dash past after completing it.
      if (same(point, next.stage.exit) && next.collectedLanterns.length === next.stage.lanterns.length) break;
    }
    if (!moved) return { ...run, facing: direction, events: [], message: blocked };
  } else collect(next);
  next.turns++;
  next.energy = dash ? run.energy - 2 : Math.min(MAX_ENERGY, run.energy + 1);
  for (const enemy of next.enemies) {
    const intent = enemyIntent(next, enemy); enemy.index = intent.index; enemy.direction = intent.direction;
  }
  touchedEnemy ||= next.enemies.some(enemy => same(enemy.route[enemy.index], next.player));
  if (touchedEnemy && run.invulnerability === 0) {
    next.health--; next.damage++; next.invulnerability = 2;
    next.events.push({ type: 'hurt', ...next.player });
  }
  if (next.health <= 0) { next.status = 'lost'; next.message = 'The wardens caught you. Retry the trail and watch their next-step markers.'; return next; }
  if (same(next.player, next.stage.exit)) {
    const missing = next.stage.lanterns.length - next.collectedLanterns.length;
    if (!missing) { next.status = 'won'; next.message = 'All lanterns restored. The trail is safe again!'; next.events.push({ type: 'win', ...next.player }); return next; }
    next.message = `The beacon needs ${missing} more ${missing === 1 ? 'lantern' : 'lanterns'}.`; return next;
  }
  const event = next.events.find(item => item.type === 'hurt') || next.events.find(item => item.type === 'lantern')
    || next.events.find(item => item.type === 'unlock') || next.events.find(item => item.type === 'key')
    || next.events.find(item => item.type === 'push') || next.events.find(item => item.type === 'heart') || next.events[0];
  const messages = { hurt: 'Ouch! Watch the red patrol markers. You have two protected turns to get clear.',
    lantern: `Lantern lit! ${next.collectedLanterns.length} of ${next.stage.lanterns.length} restored.`,
    key: 'A brass key. It opens one locked gate.', unlock: 'Gate unlocked. A new part of the trail awaits.',
    push: activePlates(next).length ? 'Pressure plate held. Keep the crate in place to hold the crossing open.' : 'Crate moved. Push it onto a copper pressure plate.',
    heart: 'A little trail magic. One heart restored.', coin: 'A trail coin! Optional treasures improve your score.' };
  next.message = event ? messages[event.type] : direction === 'wait' ? 'You wait. Patrols move and energy recharges.'
    : dash ? 'A quick dash! Walk or wait to recharge.' : 'Follow the trail. Find lanterns, treasures, and the beacon.';
  return next;
}

export function resultFor(run) {
  if (run.status !== 'won') return null;
  const par = run.stage.par || 100;
  const stars = run.damage === 0 && run.turns <= par ? 3 : run.health >= 2 && run.turns <= par * 1.5 ? 2 : 1;
  return { stars, turns: run.turns,
    score: 250 + run.collectedLanterns.length * 100 + run.collectedCoins.length * 25 + run.health * 50 + Math.max(0, par - run.turns) * 5 };
}

export function scoutHint(run) {
  const missing = run.stage.lanterns.filter(item => !run.collectedLanterns.includes(item.id));
  const target = [...missing].sort((a, b) => Math.abs(a.x - run.player.x) + Math.abs(a.y - run.player.y) - Math.abs(b.x - run.player.x) - Math.abs(b.y - run.player.y))[0] || run.stage.exit;
  const horizontal = target.x > run.player.x ? 'east' : target.x < run.player.x ? 'west' : '';
  const vertical = target.y > run.player.y ? 'south' : target.y < run.player.y ? 'north' : '';
  return `${run.stage.hint || ''} ${missing.length ? 'An unlit lantern' : 'The beacon'} lies ${[vertical, horizontal].filter(Boolean).join('-') || 'right here'}.`;
}

function distances(map, walkable, start) {
  const result = Array(walkable.length).fill(-1), queue = [start]; result[start] = 0;
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const index = queue[cursor], x = index % map.width, y = Math.floor(index / map.width);
    for (const [dx, dy] of Object.values(DIRECTIONS)) {
      const nx = x + dx, ny = y + dy, next = ny * map.width + nx;
      if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height || !walkable[next] || result[next] !== -1) continue;
      result[next] = result[index] + 1; queue.push(next);
    }
  }
  return result;
}

export function createCustomStage(document) {
  const map = validateDocument(document), walkable = walkableCells(map), visited = new Set();
  let component = [];
  for (let i = 0; i < walkable.length; i++) {
    if (!walkable[i] || visited.has(i)) continue;
    const distance = distances(map, walkable, i), group = [];
    distance.forEach((value, index) => { if (value >= 0) { visited.add(index); group.push(index); } });
    if (group.length > component.length) component = group;
  }
  if (component.length < 6) throw new Error('Your map needs at least six connected walkable tiles. Add land or bridges; trees, rocks, cabins, and deep water block movement.');
  const point = index => ({ x: index % map.width, y: Math.floor(index / map.width) });
  const start = component[0], fromStart = distances(map, walkable, start);
  const exit = [...component].sort((a, b) => fromStart[b] - fromStart[a] || a - b)[0];
  const chosen = [start, exit];
  for (let i = 0; i < 3; i++) {
    const distanceSets = chosen.map(index => distances(map, walkable, index));
    const next = component.filter(index => !chosen.includes(index)).sort((a, b) =>
      Math.min(...distanceSets.map(set => set[b])) - Math.min(...distanceSets.map(set => set[a])) || a - b)[0];
    chosen.push(next);
  }
  const coins = component.filter(index => !chosen.includes(index)).filter((_, i) => i % Math.max(1, Math.floor(component.length / 8)) === 0).slice(0, 8);
  // Three objectives have only six visit orders. Use their shortest reachable
  // tour plus breathing room, so stars reward planning even on a large map.
  const lanterns = chosen.slice(2), distanceSets = new Map(chosen.map(index => [index, distances(map, walkable, index)]));
  const tours = lanterns.flatMap(first => lanterns.filter(index => index !== first).map(second => {
    const third = lanterns.find(index => index !== first && index !== second);
    return fromStart[first] + distanceSets.get(first)[second] + distanceSets.get(second)[third] + distanceSets.get(third)[exit];
  }));
  let hash = 2166136261;
  for (const char of JSON.stringify(map)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return { id: `custom-${hash.toString(16)}`, name: map.name, subtitle: 'Your world, your expedition', map,
    start: point(start), exit: point(exit), lanterns: chosen.slice(2).map((index, i) => ({ id: `lantern-${i}`, ...point(index) })),
    coins: coins.map((index, i) => ({ id: `coin-${i}`, ...point(index) })),
    keys: [], gates: [], crates: [], plates: [], enemies: [], hearts: [],
    par: Math.max(8, Math.ceil(Math.min(...tours) * 1.2)), intro: 'Explore your own map. Restore three lanterns, then find the turquoise beacon.',
    hint: 'Every lantern is reachable on the largest connected area of visible land. Your editor map is untouched.' };
}
