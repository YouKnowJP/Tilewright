import { validateDocument } from './model.mjs';
import { freshMemory, normalizeMemory, learnMove } from './adventure-brain.mjs';
import { perkEffects } from './adventure-perks.mjs';
import { planHunters } from './adventure-tactics.mjs';
import { switchGateOpen, switchChange, choiceProblem, validateMechanisms } from './adventure-mechanisms.mjs';
import { validateTools, powerProblem, powerCost, liveEcho, waystoneProblem, pulseCells } from './adventure-tools.mjs';

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
  const echo = liveEcho(run);
  return run.stage.plates.filter(plate => same(plate, run.player) || run.crates.some(crate => same(crate, plate)) || (echo && same(plate, echo))).map(plate => plate.id);
}

export function gateIsOpen(run, gate) {
  if (gate.type === 'switch') return switchGateOpen(run, gate);
  if (gate.type === 'key') return run.openGates.includes(gate.id);
  if (gate.type === 'signal') return run.relayProgress === run.stage.sequence.length;
  if (gate.safeClose && [run.player, ...run.crates, ...run.companions, ...run.hunters, ...run.enemies.map(enemy => enemy.route[enemy.index])].some(point => same(point, gate))) return true;
  const active = activePlates(run);
  return gate.plates.every(id => active.includes(id));
}

export function canEnter(run, point, unlock = false) {
  if (!inside(run.stage.map, point)) return false;
  const gate = run.stage.gates.find(item => same(item, point));
  if (gate) {
    if (['bridge', 'signal', 'switch'].includes(gate.type)) return gateIsOpen(run, gate);
    if (!gateIsOpen(run, gate) && !(unlock && run.keyCount > 0)) return false;
  }
  if (run.stage.npcs.some(npc => !run.rescued.includes(npc.id) && same(npc, point))) return false;
  return run.walkable[point.y * run.stage.map.width + point.x];
}

function reveal(run, point) {
  const { width, height } = run.stage.map;
  const radius = Math.ceil(Math.sqrt(run.effects.sightSquared));
  for (let y = Math.max(0, point.y - radius); y <= Math.min(height - 1, point.y + radius); y++) {
    for (let x = Math.max(0, point.x - radius); x <= Math.min(width - 1, point.x + radius); x++) {
      if ((x - point.x) ** 2 + (y - point.y) ** 2 <= run.effects.sightSquared) run.seen[y * width + x] = true;
    }
  }
}

export function createRun(definition, { memory = freshMemory(), difficulty = 'trail', perks = [], loadout = null } = {}) {
  const map = validateDocument(definition.map);
  const stage = { ...definition, map };
  for (const name of ['lanterns', 'keys', 'coins', 'hearts', 'crates', 'plates', 'gates', 'enemies', 'npcs', 'relays', 'supplies', 'cover', 'hazards', 'hunters', 'switches']) {
    stage[name] = structuredClone(definition[name] || []);
  }
  const effects = perkEffects(perks);
  stage.relic = definition.relic ? structuredClone(definition.relic) : null; stage.delivery = definition.delivery ? { ...definition.delivery } : null;
  stage.restrictions = { noDash: Boolean(definition.restrictions?.noDash), noShield: Boolean(definition.restrictions?.noShield) };
  if (loadout && ['health', 'decoys', 'shields'].some(key => !Number.isInteger(loadout[key]) || loadout[key] < (key === 'health' ? 1 : 0) || loadout[key] > 3)) throw new Error('Invalid expedition supplies.');
  stage.sequence = [...(definition.sequence || [])]; stage.requiredRescues = [...(definition.requiredRescues || [])];
  stage.requiredSwitches = [...(definition.requiredSwitches || [])];
  if (definition.guild) { stage.guild = structuredClone(definition.guild); stage.waystones = structuredClone(definition.waystones || []); }
  if (!stage.start || !stage.exit || !stage.lanterns.length) throw new Error('An adventure needs a start, a beacon, and at least one lantern.');
  const points = [stage.start, stage.exit, ...stage.lanterns, ...stage.keys, ...stage.coins, ...stage.hearts,
    ...stage.crates, ...stage.plates, ...stage.gates, ...stage.enemies.flatMap(enemy => enemy.route),
    ...stage.npcs, ...stage.relays, ...stage.supplies, ...stage.cover, ...stage.hazards, ...stage.switches, ...stage.hunters.flatMap(hunter => hunter.route), ...(stage.waystones || []), ...(stage.relic ? [stage.relic, stage.delivery] : [])];
  if (points.some(point => !point || !Number.isInteger(point.x) || !Number.isInteger(point.y) || !inside(map, point))) {
    throw new Error('Adventure markers must be inside the map.');
  }
  if (stage.gates.some(gate => !['key', 'bridge', 'signal', 'switch'].includes(gate.type)
    || (gate.type === 'bridge' && (!gate.plates?.length || gate.plates.some(id => !stage.plates.some(plate => plate.id === id)))))) {
    throw new Error('Adventure gates need valid keys or pressure plates.');
  }
  validateMechanisms(stage);
  validateTools(stage);
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
    perks: [...perks], effects, carrying: false, cargoPoint: stage.relic ? { x: stage.relic.x, y: stage.relic.y } : null, cargoDelivered: false,
    difficulty: hard ? 'nemesis' : 'trail', memory: normalizeMemory(memory),
    decoys: Math.min(3, (loadout?.decoys ?? (hard ? 1 : 2)) + effects.provision), shields: Math.min(3, (loadout?.shields ?? (hard ? 1 : 2)) + effects.provision), ward: 0, lure: null, noise: 0, stun: 0, alarm: 0,
    choices: {}, rescued: [], companions: [], relayProgress: 0, usedSupplies: [], dialogue: null,
    switches: Object.fromEntries(stage.switches.map(item => [item.id, item.initial])), spentCoins: 0, talkedTo: [],
    collectedLanterns: [], collectedKeys: [], collectedCoins: [], collectedHearts: [], openGates: [],
    keyCount: 0, health: loadout?.health ?? (hard ? 2 : MAX_HEARTS), energy: MAX_ENERGY, turns: 0, damage: 0, invulnerability: 0,
    status: 'playing', seen: Array(map.width * map.height).fill(false), events: [], message: stage.intro || 'Find the lanterns, then return to the beacon.',
  };
  if (stage.guild) {
    run.guild = { kit: stage.guild.kit, readyAt: 0, uses: 0, warps: 0, veilUntil: 0 };
    if (stage.guild.kit === 'echoist') Object.assign(run.guild, { echo: null, swaps: 0 });
    run.decoys = stage.guild.kit === 'mistweaver' ? (hard ? 2 : 3) : 1;
    run.shields = stage.guild.kit === 'mistweaver' ? (hard ? 0 : 1) : (hard ? 1 : 2);
  }
  if (!canEnter(run, run.player) || stage.crates.some(crate => same(crate, run.player))) throw new Error('The starting cell is blocked.');
  if (stage.guild && stage.waystones.some(stone => !canEnter(run, stone))) throw Error('Waystones need walkable landing cells.');
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
    if (type === 'lantern' && run.effects.lanternHealing) run.health = Math.min(MAX_HEARTS, run.health + run.effects.lanternHealing);
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
  if (gate?.type === 'bridge') return run.guild?.kit === 'echoist' ? 'The crossing is closed. Hold each linked pressure plate with a crate or a lantern double.' : 'The crossing is closed. Leave crates on every linked pressure plate.';
  if (gate?.type === 'switch') return 'This crossing follows the valve settings. Inspect nearby controls and read the scout hint.';
  const keeper = run.stage.npcs.find(npc => !run.rescued.includes(npc.id) && same(npc, point));
  if (keeper) return `${keeper.name} blocks the trail. Press E to speak, or go around.`;
  return 'That way is blocked. Trees, rocks, cabins, and deep water need a different route.';
}

export function hazardActive(run, hazard, turn = run.turns) {
  if (hazard.disabledBy && run.switches[hazard.disabledBy]) return false;
  const phase = (turn + (hazard.offset || 0)) % hazard.period;
  return hazard.phases.includes(phase) || (run.difficulty === 'nemesis' && phase === (hazard.phases[0] + hazard.period - 1) % hazard.period);
}

export function nearbyInteractions(run) {
  return [...run.stage.npcs.map(item => ({ ...item, ...(run.companions.find(companion => companion.id === item.id) || {}), kind: 'npc', label: `Talk to ${item.name}` })),
    ...run.stage.relays.map(item => ({ ...item, kind: 'relay', label: `Ring ${item.name}` })),
    ...run.stage.switches.filter(item => item.operable !== false).map(item => ({ ...item, kind: 'switch', label: `${run.switches[item.id] ? 'Switch off' : 'Switch on'} ${item.name}` })),
    ...(run.stage.waystones || []).map(item => ({ ...item, kind: 'waystone', label: `Travel from ${item.name}` })),
    ...(run.stage.relic && run.cargoPoint && !run.carrying && !run.cargoDelivered ? [{ ...run.cargoPoint, id: run.stage.relic.id, name: run.stage.relic.name, kind: 'relic', label: 'Pick up the singing relic' }] : []),
    ...run.stage.supplies.filter(item => !run.usedSupplies.includes(item.id)).map(item => ({ ...item, kind: 'supply', label: 'Open trail supplies' }))]
    .filter(item => Math.abs(item.x - run.player.x) + Math.abs(item.y - run.player.y) <= 1)
    .sort((a, b) => (run.rescued.includes(a.id) ? 2 : 0) - (run.rescued.includes(b.id) ? 2 : 0) || Math.abs(a.x - run.player.x) + Math.abs(a.y - run.player.y) - Math.abs(b.x - run.player.x) - Math.abs(b.y - run.player.y));
}

export function missionGoals(run) {
  return [
    { label: `Restore ${run.stage.lanterns.length === 1 ? 'the lantern' : `all ${run.stage.lanterns.length} lanterns`}`, done: run.collectedLanterns.length === run.stage.lanterns.length },
    ...(run.stage.sequence.length ? [{ label: `Power the relay sequence (${run.relayProgress}/${run.stage.sequence.length})`, done: run.relayProgress === run.stage.sequence.length }] : []),
    ...(run.stage.requireCoins ? [{ label: `Recover every coin (${run.collectedCoins.length}/${run.stage.coins.length})`, done: run.collectedCoins.length === run.stage.coins.length }] : []),
    ...(run.stage.relic ? [{ label: 'Deliver the singing relic to the beacon', done: run.cargoDelivered }] : []),
    ...run.stage.requiredSwitches.map(id => ({ label: `Activate ${run.stage.switches.find(item => item.id === id).name}`, done: run.switches[id] })),
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
    const problem = choiceProblem(run, choice);
    if (problem) return { ...run, events: [], message: problem };
    const change = switchChange(run, choice.effect?.switches || {});
    if (change.error) return { ...run, events: [], message: change.error };
    return { ...run, choices: { ...run.choices, [npc.id]: choice.id },
      switches: change.switches, spentCoins: run.spentCoins + (choice.cost || 0), health: Math.min(MAX_HEARTS, run.health + (choice.effect?.health || 0)),
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
    return { ...run, dialogue: interaction.id, talkedTo: [...new Set([...run.talkedTo, interaction.id])], companions: rescued && !run.rescued.includes(interaction.id) ? [...run.companions, { id: interaction.id, x: interaction.x, y: interaction.y }] : run.companions, rescued: rescued ? [...new Set([...run.rescued, interaction.id])] : run.rescued,
      message: rescued ? `${interaction.name} is safe. Reach the beacon together.` : `You speak with ${interaction.name}.`, events: rescued ? [{ type: 'rescue' }] : [] };
  }
  const dash = action.startsWith('dash-'), direction = dash ? action.slice(5) : action;
  const moving = Boolean(DIRECTIONS[direction]), tactical = ['decoy', 'shield', 'power'].includes(action);
  if (!moving && direction !== 'wait' && !interaction && !tactical && action !== 'drop-cargo') return run;
  if (dash && run.stage.restrictions.noDash) return { ...run, events: [], message: 'Measured steps oath: use walking, cover, decoys, and shields.' };
  if (action === 'shield' && run.stage.restrictions.noShield) return { ...run, events: [], message: 'Unwarded oath: use cover, timing, and decoys instead of a shield.' };
  if (action === 'drop-cargo' && !run.carrying) return run;
  const toolProblem = action === 'power' ? powerProblem(run, canEnter) : interaction?.kind === 'waystone' ? waystoneProblem(run, interaction, canEnter) : null;
  if (toolProblem) return { ...run, events: [], message: toolProblem };
  if (dash && (!moving || run.energy < 2)) return { ...run, events: [], message: 'Dash needs two energy. Walk or wait to recharge.' };
  if (['decoy', 'shield'].includes(action) && run[action === 'decoy' ? 'decoys' : 'shields'] < 1) return { ...run, events: [], message: `No ${action === 'decoy' ? 'decoys' : 'shields'} left. Find supplies or ask a trail keeper.` };
  if (interaction?.kind === 'relay' && run.relayProgress === run.stage.sequence.length) return { ...run, events: [], message: 'The relay network is already powered.' };
  const change = interaction?.kind === 'switch' ? switchChange(run, { [interaction.id]: !run.switches[interaction.id] }) : null;
  if (change?.error) return { ...run, events: [], message: change.error };
  const next = { ...run, player: { ...run.player }, crates: run.crates.map(crate => ({ ...crate })),
    companions: run.companions.map(companion => ({ ...companion })),
    enemies: run.enemies.map(enemy => ({ ...enemy })), hunters: run.hunters.map(hunter => ({ ...hunter })),
    collectedLanterns: [...run.collectedLanterns], collectedKeys: [...run.collectedKeys],
    collectedCoins: [...run.collectedCoins], collectedHearts: [...run.collectedHearts], usedSupplies: [...run.usedSupplies],
    openGates: [...run.openGates], seen: [...run.seen], events: [], invulnerability: Math.max(0, run.invulnerability - 1),
    noise: Math.max(0, run.noise - 1), alarm: Math.max(0, run.alarm - 1), stun: Math.max(0, run.stun - 1), ward: Math.max(0, run.ward - 1) };
  if (run.guild) next.guild = { ...run.guild };
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
  } else if (action === 'power') {
    if (liveEcho(run)) {
      let following = { ...next.player };
      for (const companion of next.companions) { const previous = { x: companion.x, y: companion.y }; companion.x = following.x; companion.y = following.y; following = previous; }
      next.player = { x: run.guild.echo.x, y: run.guild.echo.y }; next.guild.echo = null; next.guild.swaps++;
      visited.push(next.player); collect(next); reveal(next, next.player);
      next.events.push({ type: 'echo-return', ...next.player });
    } else {
      next.guild.uses++; next.guild.readyAt = run.turns + 6;
      if (run.guild.kit === 'bellrunner') {
        const cells = pulseCells(run, canEnter);
        for (const hunter of next.hunters) if (cells.some(cell => same(cell, hunter))) hunter.dazedUntil = run.turns + 2;
      } else if (run.guild.kit === 'mistweaver') next.guild.veilUntil = run.turns + 4;
      else next.guild.echo = { x: next.player.x, y: next.player.y, until: run.turns + 7 };
      next.events.push({ type: run.guild.kit === 'bellrunner' ? 'pulse' : run.guild.kit === 'mistweaver' ? 'veil' : 'echo', ...next.player });
    }
  } else if (interaction?.kind === 'waystone') {
    const destination = next.stage.waystones.find(item => item.id === interaction.partner);
    let following = { ...next.player };
    for (const companion of next.companions) { const previous = { x: companion.x, y: companion.y }; companion.x = following.x; companion.y = following.y; following = previous; }
    next.player = { x: destination.x, y: destination.y }; visited.push(next.player); collect(next); reveal(next, next.player); next.guild.warps++;
    next.events.push({ type: 'waystone', name: destination.name, ...next.player });
  } else if (direction === 'wait') collect(next);
  else if (action === 'decoy') {
    const [dx, dy] = DIRECTIONS[next.facing]; let p = { ...next.player };
    for (let i = 0; i < 3; i++) {
      const target = { x: p.x + dx, y: p.y + dy };
      if (!canEnter(next, target) || next.crates.some(crate => same(crate, target))) break; p = target;
    }
    next.decoys--; next.lure = { ...p, until: run.turns + next.effects.decoyTurns + 1 }; next.events.push({ type: 'decoy' });
  } else if (action === 'shield') { next.shields--; next.ward = next.effects.shieldTurns; next.events.push({ type: 'shield' }); }
  else if (action === 'drop-cargo') { next.carrying = false; next.cargoPoint = { ...next.player }; next.noise = 0; next.events.push({ type: 'cargo-drop' }); }
  else if (interaction?.kind === 'relic') { next.carrying = true; next.cargoPoint = null; next.events.push({ type: 'cargo' }); }
  else if (interaction?.kind === 'switch') { next.switches = change.switches; next.events.push({ type: 'switch', name: interaction.name, active: next.switches[interaction.id] }); }
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
  next.energy = action === 'power' ? run.energy - powerCost(run) : dash ? run.energy - 2 : interaction?.kind === 'waystone' ? run.energy - 1 : moving || direction === 'wait' ? Math.min(MAX_ENERGY, run.energy + next.effects.recharge) : run.energy;
  if (moving || direction === 'wait') next.memory = learnMove(run.memory, action);
  if (dash) next.noise = next.effects.dashNoise;
  if (next.carrying) next.noise = Math.max(next.noise, 2);
  if (next.carrying && same(next.player, next.stage.delivery)) { next.carrying = false; next.cargoDelivered = true; next.cargoPoint = null; next.events.push({ type: 'delivery' }); }
  for (const enemy of next.enemies) {
    const intent = enemyIntent(next, enemy); enemy.index = intent.index; enemy.direction = intent.direction;
  }
  for (const hunter of next.hunters) {
    const intent = hunter.intent;
    if (next.stun === 0 && !(next.turns <= hunter.dazedUntil) && canEnter(next, intent) && !next.crates.some(crate => same(crate, intent))) { hunter.x = intent.x; hunter.y = intent.y; }
  }
  if (next.guild?.echo && (next.guild.echo.until <= next.turns || [...next.hunters, ...next.enemies.map(enemy => enemy.route[enemy.index])].some(point => same(point, next.guild.echo)))) {
    next.events.push({ type: 'echo-fade', ...next.guild.echo }); next.guild.echo = null;
  }
  touchedEnemy ||= next.enemies.some(enemy => same(enemy.route[enemy.index], next.player)) || next.hunters.some(hunter => same(hunter, next.player));
  touchedEnemy ||= next.stun === 0 && run.hunters.some(hunter => !(next.turns <= next.hunters.find(item => item.id === hunter.id)?.dazedUntil) && (hunter.attack || []).some(cell => [...visited, next.player].some(point => same(cell, point))));
  const burned = next.stage.hazards.some(hazard => hazardActive(next, hazard) && [...visited, next.player].some(p => same(p, hazard)));
  if ((touchedEnemy || burned) && run.invulnerability === 0) {
    if (next.ward > 0) next.events.push({ type: 'blocked-hit' });
    else {
      next.health--; next.damage++; next.invulnerability = (next.difficulty === 'nemesis' ? 1 : 2) + next.effects.protection;
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
  const priority = ['hurt', 'blocked-hit', 'delivery', 'cargo', 'cargo-drop', 'echo-return', 'echo-fade', 'echo', 'pulse', 'veil', 'waystone', 'switch', 'relay-complete', 'alarm', 'relay', 'supply', 'decoy', 'shield', 'phase', 'lantern', 'unlock', 'key', 'push', 'heart', 'coin'];
  const event = priority.map(type => next.events.find(item => item.type === type)).find(Boolean);
  const messages = { hurt: 'Ouch! Watch the next-step markers and ember cycles. You have protected turns to get clear.',
    pulse: 'Resonance pulse! Hunters within four reachable steps halt for this turn and the next. Contact and fire still hurt.',
    veil: 'Mist veil raised. Existing enemy plans still resolve; move away from their last lead. Cargo and alarms reveal you.',
    echo: 'Double cast! Six more turns to lure hunters or hold a plate. B returns to it for one energy. Check Plan before returning.',
    'echo-return': 'Returned to your double. One energy spent; the double dissolves and enemies take their turn.',
    'echo-fade': 'Your double has faded or a hunter reached it. Check pressure crossings before moving.',
    waystone: `Waystone crossed to ${event?.name}. One energy spent; enemies moved once.`,
    'blocked-hit': 'Your shield absorbs the hit. Keep moving before it fades.',
    'relay-complete': 'The relay network is powered! Signal gates open and hunters are stunned for three more turns.',
    alarm: 'Wrong relay! The sequence reset and every hunter heard the alarm. Break line of sight.',
    relay: `Relay ${next.relayProgress} of ${next.stage.sequence.length} powered.`, supply: 'Supplies found: one heart, a decoy, and a shield charge.',
    decoy: `A false lantern! Nearby hunters follow it for ${next.effects.decoyTurns} turns. Take another route.`, shield: `Shield raised for ${next.effects.shieldTurns} turns, including this one. It blocks wardens, sweeps, and embers.`,
    cargo: 'The relic is singing. Hunters can hear you; press X to set it down and draw them away.',
    switch: `${event?.name} switched ${event?.active ? 'on' : 'off'}. Check the crossings and ember warnings before moving.`,
    'cargo-drop': 'Relic set down. Its song is a false trail; pick it up again with Interact.', delivery: 'Relic delivered safely! Finish any remaining objectives and reach the beacon.',
    phase: `Lantern restored. Watcher phase ${boss?.phase}: “${boss?.phase === 2 ? 'I have seen that turn before.' : 'Then I will meet you where you always run.'}” Watch for its marked sweep.`,
    lantern: `Lantern lit! ${next.collectedLanterns.length} of ${next.stage.lanterns.length} restored.`,
    key: 'A brass key. It opens one locked gate.', unlock: 'Gate unlocked. A new part of the trail awaits.',
    push: activePlates(next).length ? 'Pressure plate held. Keep the crate in place to hold the crossing open.' : 'Crate moved. Push it onto a copper pressure plate.',
    heart: 'One heart restored.', coin: next.stage.requireCoins ? 'A trail coin! Recover every coin before leaving this trail.' : 'A trail coin! Optional treasures improve your score.' };
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
  const coin = run.stage.requireCoins && run.stage.coins.find(item => !run.collectedCoins.includes(item.id));
  const cargo = run.stage.relic && !run.cargoDelivered ? run.carrying ? run.stage.delivery : run.cargoPoint : null;
  const key = run.keyCount === 0 && run.stage.gates.some(gate => gate.type === 'key' && !gateIsOpen(run, gate)) ? run.stage.keys.find(item => !run.collectedKeys.includes(item.id)) : null;
  let mechanism = null;
  const preferred = key || relay || lantern || npc || coin || cargo || run.stage.exit;
  if (run.stage.switches.length) {
    const found = new Set([`${run.player.x},${run.player.y}`]), queue = [run.player];
    for (const point of queue) for (const [dx, dy] of Object.values(DIRECTIONS)) {
      const next = { x: point.x + dx, y: point.y + dy }, id = `${next.x},${next.y}`;
      if (!found.has(id) && canEnter(run, next, true) && !run.crates.some(crate => same(crate, next))) { found.add(id); queue.push(next); }
    }
    const reachable = item => found.has(`${item.x},${item.y}`);
    mechanism = run.stage.switches.find(item => run.stage.requiredSwitches.includes(item.id) && !run.switches[item.id] && reachable(item));
    if (!mechanism && !reachable(preferred)) mechanism = run.stage.switches.find(item => !run.switches[item.id] && reachable(item)
      && run.stage.gates.some(gate => gate.type === 'switch' && gate.controls.some(control => control.id === item.id && control.on)));
    if (mechanism && (key || relay) && reachable(preferred)) mechanism = null;
  }
  const target = mechanism || key || relay || lantern || npc || coin || cargo || run.stage.exit;
  const label = mechanism ? mechanism.name : key ? 'A brass key' : relay ? `The next relay, ${relay.name || relay.id},` : lantern ? 'An unlit lantern' : npc ? npc.name : coin ? 'An unrecovered coin' : cargo ? run.carrying ? 'The relic delivery beacon' : 'The singing relic' : 'The beacon';
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
