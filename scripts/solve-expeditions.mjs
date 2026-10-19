// Developer playthrough generator. It uses ordinary public game actions and
// never changes health, inventory, enemies, puzzle flags, or positions.
import { canEnter, stepRun, nearbyInteractions } from '../src/adventure.mjs';
import { advanceJourney } from '../src/adventure-journey.mjs';
const vectors = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
const same = (a, b) => a.x === b.x && a.y === b.y;
function routes(run, target = null) {
  const map = run.stage.map, start = run.player.y * map.width + run.player.x;
  const parent = new Int32Array(map.width * map.height).fill(-1), distance = new Int32Array(parent.length).fill(-1), queue = [start];
  parent[start] = start; distance[start] = 0;
  for (const index of queue) {
    const x = index % map.width, y = Math.floor(index / map.width);
    for (const [dx, dy] of Object.values(vectors)) {
      const point = { x: x + dx, y: y + dy }, next = point.y * map.width + point.x;
      if (point.x < 0 || point.y < 0 || point.x >= map.width || point.y >= map.height || parent[next] !== -1 || !canEnter(run, point, true)) continue;
      parent[next] = index; distance[next] = distance[index] + 1; queue.push(next);
    }
  }
  const path = [];
  if (target) {
    let index = target.y * map.width + target.x;
    if (distance[index] < 0) throw new Error(`Unreachable target ${JSON.stringify(target)} on ${run.stage.id}.`);
    while (index !== start) { path.push({ x: index % map.width, y: Math.floor(index / map.width) }); index = parent[index]; }
    path.reverse();
  }
  return { path, distance };
}
class Heap {
  items = [];
  push(value) { const list = this.items; let i = list.length; list.push(value); while (i > 0) { const p = (i - 1) >> 1; if (list[p].cost <= value.cost) break; list[i] = list[p]; i = p; } list[i] = value; }
  pop() { const list = this.items, first = list[0], last = list.pop(); if (list.length) { let i = 0; while (i * 2 + 1 < list.length) { let child = i * 2 + 1; if (child + 1 < list.length && list[child + 1].cost < list[child].cost) child++; if (list[child].cost >= last.cost) break; list[i] = list[child]; i = child; } list[i] = last; } return first; }
}
function stateKey(run) {
  return JSON.stringify([run.player, run.turns % 12, run.health, run.energy, run.ward, run.invulnerability, run.noise, run.alarm, run.stun, run.decoys, run.shields,
    run.lure && [run.lure.x, run.lure.y, Math.max(0, run.lure.until - run.turns)], run.carrying, run.cargoPoint, run.cargoDelivered,
    run.hunters.map(h => [h.x, h.y, h.intent, h.memory, h.lastSeen, h.patrolIndex, h.attack]), run.collectedLanterns, run.collectedKeys, run.collectedHearts, run.usedSupplies, run.openGates]);
}
function localPath(initial, target, limit = 4000) {
  // Reverse distances are an admissible movement heuristic, independent of
  // enemies and hazard timing; every candidate is evaluated by the real rules.
  const map = initial.stage.map, origin = { ...initial, player: target }, distances = routes(origin).distance;
  const estimate = run => Math.max(0, distances[run.player.y * map.width + run.player.x]) / (run.stage.restrictions.noDash ? 1 : 2);
  const heap = new Heap(), best = new Map(); heap.push({ run: initial, actions: [], cost: estimate(initial) });
  for (let expanded = 0; heap.items.length && expanded < limit; expanded++) {
    const node = heap.pop(), run = node.run;
    if (same(run.player, target) || run.status === 'won') return node.actions;
    const key = stateKey(run); if ((best.get(key) ?? Infinity) <= node.actions.length) continue; best.set(key, node.actions.length);
    const nearby = nearbyInteractions(run)[0];
    const actions = ['up', 'right', 'down', 'left', 'dash-up', 'dash-right', 'dash-down', 'dash-left', 'wait', 'shield', 'decoy',
      ...(nearby?.kind === 'supply' ? [`interact:${nearby.id}`] : [])];
    for (const action of actions) {
      if ((action === 'shield' && run.ward > 1) || (action === 'decoy' && run.lure && run.lure.until - run.turns > 2)) continue;
      const next = stepRun(run, action); if (next.turns === run.turns || next.status === 'lost') continue;
      const moves = [...node.actions, action];
      const cost = moves.length + (next.damage - initial.damage) * 22 + Math.max(0, initial.shields - next.shields) * 2
        + Math.max(0, initial.decoys - next.decoys) * 2 + estimate(next);
      heap.push({ run: next, actions: moves, cost });
    }
  }
  throw new Error(`No local route on ${initial.stage.id}: ${JSON.stringify(initial.player)} -> ${JSON.stringify(target)}.`);
}
export function solveExpeditionLeg(initial) {
  let session = initial; const actions = [];
  const act = action => { session = advanceJourney(session, action); actions.push(action); if (session.phase === 'lost') throw new Error(`Playthrough lost on ${session.run.stage.id}.`); };
  const go = target => {
    for (let segments = 0; !same(session.run.player, target) && session.phase === 'playing'; segments++) {
      if (segments > 160) throw new Error('Navigation did not converge.');
      const path = routes(session.run, target).path;
      let moves, failure;
      for (const reach of [5, 2, 0]) {
        try { moves = localPath(session.run, path[Math.min(path.length - 1, reach)], reach === 0 ? 16000 : 4000); break; }
        catch (error) { failure = error; }
      }
      if (!moves) throw failure;
      for (const action of moves) { act(action); if (session.phase !== 'playing') break; }
    }
  };
  const approach = target => {
    const map = session.run.stage.map, distance = routes(session.run).distance;
    const options = Object.values(vectors).map(([dx, dy]) => ({ x: target.x + dx, y: target.y + dy }))
      .filter(point => point.x >= 0 && point.y >= 0 && point.x < map.width && point.y < map.height && distance[point.y * map.width + point.x] >= 0)
      .sort((a, b) => distance[a.y * map.width + a.x] - distance[b.y * map.width + b.x]);
    if (!options.length) throw new Error('No approach to keeper.'); go(options[0]);
  };
  const stage = session.run.stage;
  act('interact:guide'); act(`choose:${session.config.vow === 'unwarded' || session.run.shields >= 3 ? 'decoy' : 'shield'}`); act('close-dialogue');
  for (const key of stage.keys) go(key);
  for (const id of stage.sequence) { go(stage.relays.find(relay => relay.id === id)); act(`interact:${id}`); }
  if (stage.requireCoins) for (const coin of stage.coins) if (!session.run.collectedCoins.includes(coin.id)) go(coin);
  for (const lantern of stage.lanterns) if (!session.run.collectedLanterns.includes(lantern.id)) go(lantern);
  if (stage.relic) { go(stage.relic); act(`interact:${stage.relic.id}`); go(stage.delivery); }
  for (const id of stage.requiredRescues) { approach(stage.npcs.find(npc => npc.id === id)); act(`interact:${id}`); act('close-dialogue'); }
  if (session.phase === 'playing') { go(stage.exit); if (session.phase === 'playing') act('wait'); }
  if (!['camp', 'won'].includes(session.phase)) throw new Error(`Incomplete mission ${stage.id}.`);
  return { session, actions };
}
