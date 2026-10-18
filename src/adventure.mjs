import { validateDocument } from './model.mjs';
import { freshMemory, normalizeMemory, learnMove } from './adventure-brain.mjs';
import { planHunters } from './adventure-tactics.mjs';

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
  if (gate.type === 'signal') return run.relayProgress === run.stage.sequence.length;
  const active = activePlates(run);
  return gate.plates.every(id => active.includes(id));
}

export function canEnter(run, point, unlock = false) {
  if (!inside(run.stage.map, point)) return false;
  const gate = run.stage.gates.find(item => same(item, point));
  if (gate) {
    if (gate.type === 'bridge' || gate.type === 'signal') return gateIsOpen(run, gate);
    if (!gateIsOpen(run, gate) && !(unlock && run.keyCount > 0)) return false;
  }
  if (run.stage.npcs.some(npc => !run.rescued.includes(npc.id) && same(npc, point))) return false;
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

export function createRun(definition, { memory = freshMemory(), difficulty = 'trail' } = {}) {
  const map = validateDocument(definition.map);
  const stage = { ...definition, map };
  for (const name of ['lanterns', 'keys', 'coins', 'hearts', 'crates', 'plates', 'gates', 'enemies', 'npcs', 'relays', 'supplies', 'cover', 'hazards', 'hunters']) {
    stage[name] = structuredClone(definition[name] || []);
  }
  stage.sequence = [...(definition.sequence || [])]; stage.requiredRescues = [...(definition.requiredRescues || [])];
  if (!stage.start || !stage.exit || !stage.lanterns.length) throw new Error('An adventure needs a start, a beacon, and at least one lantern.');
  const points = [stage.start, stage.exit, ...stage.lanterns, ...stage.keys, ...stage.coins, ...stage.hearts,
    ...stage.crates, ...stage.plates, ...stage.gates, ...stage.enemies.flatMap(enemy => enemy.route),
    ...stage.npcs, ...stage.relays, ...stage.supplies, ...stage.cover, ...stage.hazards, ...stage.hunters.flatMap(hunter => hunter.route)];
  if (points.some(point => !point || !Number.isInteger(point.x) || !Number.isInteger(point.y) || !inside(map, point))) {
    throw new Error('Adventure markers must be inside the map.');
  }
  if (stage.gates.some(gate => !['key', 'bridge', 'signal'].includes(gate.type)
    || (gate.type === 'bridge' && (!gate.plates?.length || gate.plates.some(id => !stage.plates.some(plate => plate.id === id)))))) {
    throw new Error('Adventure gates need valid keys or pressure plates.');
  }
  if (stage.enemies.some(enemy => enemy.route.length < 2
    || enemy.route.some((point, index) => index && Math.abs(point.x - enemy.route[index - 1].x) + Math.abs(point.y - enemy.route[index - 1].y) !== 1))) {
    throw new Error('Patrol routes must connect adjacent cells.');
  }
  if (stage.sequence.some(id => !stage.relays.some(relay => relay.id === id))
    || stage.requiredRescues.some(id => !stage.npcs.some(npc => npc.id === id))
    || stage.hunters.some(hunter => hunter.route.length < 2)
    || stage.hazards.some(hazard => !Number.isInteger(hazard.period) || hazard.period < 3 || hazard.period > 12
      || !Array.isArray(hazard.phases) || hazard.phases.some(phase => !Number.isInteger(phase) || phase < 0 || phase >= hazard.period))) {
    throw new Error('Mission relays, rescues, hunter routes, and hazard cycles must be valid.');
  }
  const hard = difficulty === 'nemesis';
  const hunters = [...stage.hunters.filter(hunter => !hunter.nemesisOnly || hard), ...(hard ? stage.enemies.map(enemy => ({ ...enemy, vision: 7 })) : [])];
  const run = {
    stage, walkable: walkableCells(map), player: { ...stage.start }, facing: 'down',
    crates: stage.crates.map(crate => ({ ...crate })),
    enemies: (hard ? [] : stage.enemies).map(enemy => ({ ...enemy, index: 0, direction: 1 })),
    hunters: hunters.map(hunter => ({ ...hunter, ...hunter.route[0], patrolIndex: 1, memory: 0 })),
    difficulty: hard ? 'nemesis' : 'trail', memory: normalizeMemory(memory),
    decoys: hard ? 1 : 2, shields: hard ? 1 : 2, ward: 0, lure: null, noise: 0, stun: 0, alarm: 0,
    choices: {}, rescued: [], companions: [], relayProgress: 0, usedSupplies: [], dialogue: null,
    collectedLanterns: [], collectedKeys: [], collectedCoins: [], collectedHearts: [], openGates: [],
    keyCount: 0, health: hard ? 2 : MAX_HEARTS, energy: MAX_ENERGY, turns: 0, damage: 0, invulnerability: 0,
    status: 'playing', seen: Array(map.width * map.height).fill(false), events: [], message: stage.intro || 'Find the lanterns, then return to the beacon.',
  };
  if (!canEnter(run, run.player) || stage.crates.some(crate => same(crate, run.player))) throw new Error('The starting cell is blocked.');
  reveal(run, run.player);
  run.hunters = planHunters(run, canEnter);
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
  if (run.lure && run.lure.until > run.turns) {
    const distance = p => Math.abs(p.x - run.lure.x) + Math.abs(p.y - run.lure.y);
    if (distance(enemy.route[enemy.index]) <= 10) {
      const closest = enemy.route.map((point, index) => ({ index, distance: distance(point) })).sort((a, b) => a.distance - b.distance)[0].index;
      const direction = Math.sign(closest - enemy.index), index = enemy.index + direction;
      const point = enemy.route[index];
      if (canEnter(run, point) && !run.crates.some(crate => same(crate, point))) return { index, direction: direction || enemy.direction, point };
    }
  }
  let direction = enemy.direction, index = enemy.index + direction;
  if (index < 0 || index >= enemy.route.length) { direction *= -1; index = enemy.index + direction; }
  const target = enemy.route[index];
  if (!canEnter(run, target) || run.crates.some(crate => same(crate, target))) return { index: enemy.index, direction: -direction, point: enemy.route[enemy.index] };
  return { index, direction, point: target };
}

function blockMessage(run, point) {
  const gate = run.stage.gates.find(item => same(item, point));
  if (gate?.type === 'key' && !gateIsOpen(run, gate)) return 'A locked gate. Find a key first.';
  if (gate?.type === 'signal') return 'A signal gate. Ring the relays in the correct order to open it.';
  if (gate?.type === 'bridge') return 'The crossing is closed. Leave crates on every linked pressure plate.';
  return 'That way is blocked. Trees, rocks, cabins, and deep water need a different route.';
}

export function hazardActive(run, hazard, turn = run.turns) {
  const phase = (turn + (hazard.offset || 0)) % hazard.period;
  return hazard.phases.includes(phase) || (run.difficulty === 'nemesis' && phase === (hazard.phases[0] + hazard.period - 1) % hazard.period);
}

export function nearbyInteractions(run) {
  return [...run.stage.npcs.map(item => ({ ...item, ...(run.companions.find(companion => companion.id === item.id) || {}), kind: 'npc', label: `Talk to ${item.name}` })),
    ...run.stage.relays.map(item => ({ ...item, kind: 'relay', label: `Ring ${item.name}` })),
    ...run.stage.supplies.filter(item => !run.usedSupplies.includes(item.id)).map(item => ({ ...item, kind: 'supply', label: 'Open trail supplies' }))]
    .filter(item => Math.abs(item.x - run.player.x) + Math.abs(item.y - run.player.y) <= 1)
    .sort((a, b) => (run.rescued.includes(a.id) ? 2 : 0) - (run.rescued.includes(b.id) ? 2 : 0) || Math.abs(a.x - run.player.x) + Math.abs(a.y - run.player.y) - Math.abs(b.x - run.player.x) - Math.abs(b.y - run.player.y));
}

export function missionGoals(run) {
  return [
    { label: `Restore all ${run.stage.lanterns.length} lanterns`, done: run.collectedLanterns.length === run.stage.lanterns.length },
    ...(run.stage.sequence.length ? [{ label: `Power the relay sequence (${run.relayProgress}/${run.stage.sequence.length})`, done: run.relayProgress === run.stage.sequence.length }] : []),
    ...run.stage.requiredRescues.map(id => ({ label: `Return to rescue ${run.stage.npcs.find(npc => npc.id === id).name} after restoring the lights`, done: run.rescued.includes(id) })),
  ];
}
export const missionComplete = run => missionGoals(run).every(goal => goal.done);

function conversation(run, action) {
  if (action === 'close-dialogue') return { ...run, dialogue: null, events: [] };
  if (action.startsWith('choose:') && run.dialogue) {
    const npc = run.stage.npcs.find(item => item.id === run.dialogue);
    const choice = npc.choices?.find(item => item.id === action.slice(7));
    if (!choice || Object.hasOwn(run.choices, npc.id)) return run;
    return { ...run, choices: { ...run.choices, [npc.id]: choice.id },
      decoys: Math.min(3, run.decoys + (choice.effect?.decoys || 0)),
      shields: Math.min(3, run.shields + (choice.effect?.shields || 0)),
      message: choice.response, events: [{ type: 'choice' }] };
  }
  return run;
}

export function stepRun(run, action) {
  if (run.status !== 'playing' || typeof action !== 'string') return run;
  if (run.dialogue || action === 'close-dialogue') return conversation(run, action);
  const interaction = action.startsWith('interact:') ? nearbyInteractions(run).find(item => item.id === action.slice(9)) : null;
  if (interaction?.kind === 'npc') {
    const rescued = run.stage.requiredRescues.includes(interaction.id) && run.collectedLanterns.length === run.stage.lanterns.length;
    return { ...run, dialogue: interaction.id, companions: rescued && !run.rescued.includes(interaction.id) ? [...run.companions, { id: interaction.id, x: interaction.x, y: interaction.y }] : run.companions, rescued: rescued ? [...new Set([...run.rescued, interaction.id])] : run.rescued,
      message: rescued ? `${interaction.name} is safe. Reach the beacon together.` : `You speak with ${interaction.name}.`, events: rescued ? [{ type: 'rescue' }] : [] };
  }
  const dash = action.startsWith('dash-'), direction = dash ? action.slice(5) : action;
  const moving = Boolean(DIRECTIONS[direction]), tactical = ['decoy', 'shield'].includes(action);
  if (!moving && direction !== 'wait' && !interaction && !tactical) return run;
  if (dash && (!moving || run.energy < 2)) return { ...run, events: [], message: 'Dash needs two energy. Walk or wait to recharge.' };
  if (tactical && run[action === 'decoy' ? 'decoys' : 'shields'] < 1) return { ...run, events: [], message: `No ${action === 'decoy' ? 'decoys' : 'shields'} left. Find supplies or ask a trail keeper.` };
  if (interaction?.kind === 'relay' && run.relayProgress === run.stage.sequence.length) return { ...run, events: [], message: 'The relay network is already powered.' };
  const next = { ...run, player: { ...run.player }, crates: run.crates.map(crate => ({ ...crate })),
    companions: run.companions.map(companion => ({ ...companion })),
    enemies: run.enemies.map(enemy => ({ ...enemy })), hunters: run.hunters.map(hunter => ({ ...hunter })),
    collectedLanterns: [...run.collectedLanterns], collectedKeys: [...run.collectedKeys],
    collectedCoins: [...run.collectedCoins], collectedHearts: [...run.collectedHearts], usedSupplies: [...run.usedSupplies],
    openGates: [...run.openGates], seen: [...run.seen], events: [], invulnerability: Math.max(0, run.invulnerability - 1),
    noise: Math.max(0, run.noise - 1), alarm: Math.max(0, run.alarm - 1), stun: Math.max(0, run.stun - 1), ward: Math.max(0, run.ward - 1) };
  let moved = false, touchedEnemy = false, blocked = '';
  const visited = [];
  if (moving) {
    const [dx, dy] = DIRECTIONS[direction]; next.facing = direction;
    for (let distance = 0; distance < (dash ? 2 : 1); distance++) {
      const point = { x: next.player.x + dx, y: next.player.y + dy };
      if (!canEnter(next, point, true)) { blocked = blockMessage(next, point); break; }
      const crate = next.crates.find(item => same(item, point));
      if (crate) {
        const destination = { x: point.x + dx, y: point.y + dy };
        if (!canEnter(next, destination) || next.crates.some(item => same(item, destination))) { blocked = 'The crate cannot move that way. Try pushing from another side.'; break; }
        crate.x = destination.x; crate.y = destination.y; next.events.push({ type: 'push', x: crate.x, y: crate.y });
      }
      const gate = next.stage.gates.find(item => same(item, point));
      if (gate?.type === 'key' && !gateIsOpen(next, gate)) {
        next.keyCount--; next.openGates.push(gate.id); next.events.push({ type: 'unlock', ...point });
      }
      let following = { ...next.player };
      for (const companion of next.companions) { const previous = { x: companion.x, y: companion.y }; companion.x = following.x; companion.y = following.y; following = previous; }
      next.player = point; visited.push(point); moved = true;
      touchedEnemy ||= next.enemies.some(enemy => same(enemy.route[enemy.index], point)) || next.hunters.some(hunter => same(hunter, point));
      collect(next); reveal(next, point);
      if (same(point, next.stage.exit) && missionComplete(next)) break;
    }
    if (!moved) return { ...run, facing: direction, events: [], message: blocked };
  } else if (direction === 'wait') collect(next);
  else if (action === 'decoy') {
    const [dx, dy] = DIRECTIONS[next.facing]; let p = { ...next.player };
    for (let i = 0; i < 3; i++) {
      const target = { x: p.x + dx, y: p.y + dy };
      if (!canEnter(next, target) || next.crates.some(crate => same(crate, target))) break; p = target;
    }
    next.decoys--; next.lure = { ...p, until: run.turns + 6 }; next.events.push({ type: 'decoy' });
  } else if (action === 'shield') { next.shields--; next.ward = 3; next.events.push({ type: 'shield' }); }
  else if (interaction?.kind === 'supply') {
    next.usedSupplies.push(interaction.id); next.decoys = Math.min(3, next.decoys + 1); next.shields = Math.min(3, next.shields + 1);
    next.health = Math.min(MAX_HEARTS, next.health + 1); next.events.push({ type: 'supply' });
  } else if (interaction?.kind === 'relay') {
    if (next.stage.sequence[next.relayProgress] === interaction.id) {
      next.relayProgress++; next.events.push({ type: next.relayProgress === next.stage.sequence.length ? 'relay-complete' : 'relay' });
      if (next.relayProgress === next.stage.sequence.length) { next.stun = 4; next.alarm = 0; }
    } else {
      next.relayProgress = next.stage.sequence[0] === interaction.id ? 1 : 0;
      next.alarm = 6; next.events.push({ type: 'alarm' });
    }
  }
  next.turns++;
  next.energy = dash ? run.energy - 2 : moving || direction === 'wait' ? Math.min(MAX_ENERGY, run.energy + 1) : run.energy;
  if (moving || direction === 'wait') next.memory = learnMove(run.memory, action);
  if (dash) next.noise = 3;
  for (const enemy of next.enemies) {
    const intent = enemyIntent(next, enemy); enemy.index = intent.index; enemy.direction = intent.direction;
  }
  for (const hunter of next.hunters) {
    const intent = hunter.intent;
    if (next.stun === 0 && canEnter(next, intent) && !next.crates.some(crate => same(crate, intent))) { hunter.x = intent.x; hunter.y = intent.y; }
  }
  touchedEnemy ||= next.enemies.some(enemy => same(enemy.route[enemy.index], next.player)) || next.hunters.some(hunter => same(hunter, next.player));
  touchedEnemy ||= next.stun === 0 && run.hunters.some(hunter => (hunter.attack || []).some(cell => [...visited, next.player].some(point => same(cell, point))));
  const burned = next.stage.hazards.some(hazard => hazardActive(next, hazard) && [...visited, next.player].some(p => same(p, hazard)));
  if ((touchedEnemy || burned) && run.invulnerability === 0) {
    if (next.ward > 0) next.events.push({ type: 'blocked-hit' });
    else {
      next.health--; next.damage++; next.invulnerability = next.difficulty === 'nemesis' ? 1 : 2;
      next.events.push({ type: 'hurt', ...next.player });
    }
  }
  next.hunters = planHunters(next, canEnter);
  const boss = next.hunters.find(hunter => hunter.boss), previousBoss = run.hunters.find(hunter => hunter.boss);
  if (boss && previousBoss && boss.phase > previousBoss.phase) next.events.push({ type: 'phase' });
  if (next.health <= 0) { next.status = 'lost'; next.message = 'The trail caught you. Try cover, a decoy, a shield, or a different route.'; return next; }
  if (same(next.player, next.stage.exit)) {
    const missing = missionGoals(next).filter(goal => !goal.done);
    if (!missing.length) { next.status = 'won'; next.message = 'Mission complete. The trail is safe again!'; next.events.push({ type: 'win', ...next.player }); return next; }
    const lanterns = next.stage.lanterns.length - next.collectedLanterns.length;
    next.message = lanterns ? `The beacon needs ${lanterns} more ${lanterns === 1 ? 'lantern' : 'lanterns'}.` : `Before leaving: ${missing.map(goal => goal.label.toLowerCase()).join('; ')}.`; return next;
  }
  const priority = ['hurt', 'blocked-hit', 'relay-complete', 'alarm', 'relay', 'supply', 'decoy', 'shield', 'phase', 'lantern', 'unlock', 'key', 'push', 'heart', 'coin'];
  const event = priority.map(type => next.events.find(item => item.type === type)).find(Boolean);
  const messages = { hurt: 'Ouch! Watch the next-step markers and ember cycles. You have protected turns to get clear.',
    'blocked-hit': 'Your shield absorbs the hit. Keep moving before it fades.',
    'relay-complete': 'The relay network is powered! Signal gates open and hunters are stunned for three more turns.',
    alarm: 'Wrong relay! The sequence reset and every hunter heard the alarm. Break line of sight.',
    relay: `Relay ${next.relayProgress} of ${next.stage.sequence.length} powered.`, supply: 'Supplies found: one heart, a decoy, and a shield charge.',
    decoy: 'A false lantern! Nearby hunters follow it for five turns. Take another route.', shield: 'Shield raised for this turn and the next two. It blocks wardens and embers.',
    phase: `Lantern restored. Watcher phase ${boss?.phase}: “${boss?.phase === 2 ? 'I have seen that turn before.' : 'Then I will meet you where you always run.'}” Watch for its marked sweep.`,
    lantern: `Lantern lit! ${next.collectedLanterns.length} of ${next.stage.lanterns.length} restored.`,
    key: 'A brass key. It opens one locked gate.', unlock: 'Gate unlocked. A new part of the trail awaits.',
    push: activePlates(next).length ? 'Pressure plate held. Keep the crate in place to hold the crossing open.' : 'Crate moved. Push it onto a copper pressure plate.',
    heart: 'One heart restored.', coin: 'A trail coin! Optional treasures improve your score.' };
  next.message = event ? messages[event.type] : direction === 'wait' ? 'You wait. Enemies move and energy recharges.'
    : dash ? 'A quick dash! Hunters nearby can hear it. Walk or wait to recharge.' : 'Watch the hunters. Use cover, change direction, or create an opening.';
  return next;
}

export const turnTarget = run => Math.max(8, Math.floor((run.stage.par || 100) * (run.difficulty === 'nemesis' ? .85 : 1)));
export const recordId = run => `${run.stage.id}${run.difficulty === 'nemesis' ? '-nemesis' : ''}`;

export function resultFor(run) {
  if (run.status !== 'won') return null;
  const par = turnTarget(run);
  const stars = run.damage === 0 && run.turns <= par ? 3 : run.health >= 2 && run.turns <= par * 1.5 ? 2 : 1;
  return { stars, turns: run.turns,
    score: 250 + run.collectedLanterns.length * 100 + run.collectedCoins.length * 25 + run.health * 50 + Math.max(0, par - run.turns) * 5 };
}

export function scoutHint(run) {
  const missing = run.stage.lanterns.filter(item => !run.collectedLanterns.includes(item.id));
  const rescue = run.stage.requiredRescues.find(id => !run.rescued.includes(id));
  const relay = run.stage.sequence.length > run.relayProgress ? run.stage.relays.find(item => item.id === run.stage.sequence[run.relayProgress]) : null;
  const lantern = [...missing].sort((a, b) => Math.abs(a.x - run.player.x) + Math.abs(a.y - run.player.y) - Math.abs(b.x - run.player.x) - Math.abs(b.y - run.player.y))[0];
  const npc = rescue && run.stage.npcs.find(item => item.id === rescue);
  const target = relay || lantern || npc || run.stage.exit;
  const label = relay ? `The next relay, ${relay.name || relay.id},` : lantern ? 'An unlit lantern' : npc ? npc.name : 'The beacon';
  const horizontal = target.x > run.player.x ? 'east' : target.x < run.player.x ? 'west' : '';
  const vertical = target.y > run.player.y ? 'south' : target.y < run.player.y ? 'north' : '';
  return `${run.stage.hint || ''} ${label} lies ${[vertical, horizontal].filter(Boolean).join('-') || 'right here'}.`;
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
