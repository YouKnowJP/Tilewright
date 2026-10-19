import { predictMove } from './adventure-brain.mjs';
const vectors = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
const same = (a, b) => a.x === b.x && a.y === b.y;
export const hunterPoint = hunter => ({ x: hunter.x, y: hunter.y });

function lineOfSight(from, to, passable) {
  let x = from.x, y = from.y;
  const dx = Math.abs(to.x - x), dy = Math.abs(to.y - y), sx = x < to.x ? 1 : -1, sy = y < to.y ? 1 : -1;
  let error = dx - dy;
  while (x !== to.x || y !== to.y) {
    const twice = error * 2;
    if (twice > -dy) { error -= dy; x += sx; }
    if (twice < dx) { error += dx; y += sy; }
    if ((x !== to.x || y !== to.y) && !passable({ x, y })) return false;
  }
  return true;
}

export function nextPathStep(from, target, width, height, passable) {
  const start = from.y * width + from.x, goal = target.y * width + target.x;
  if (start === goal) return { ...from };
  const queue = [start], parent = new Int32Array(width * height).fill(-1); parent[start] = start;
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const index = queue[cursor], x = index % width, y = Math.floor(index / width);
    const neighbors = Object.values(vectors).map(([dx, dy]) => ({ x: x + dx, y: y + dy }))
      .sort((a, b) => Math.abs(a.x - target.x) + Math.abs(a.y - target.y) - Math.abs(b.x - target.x) - Math.abs(b.y - target.y));
    for (const p of neighbors) {
      if (p.x < 0 || p.y < 0 || p.x >= width || p.y >= height) continue;
      const next = p.y * width + p.x;
      if (parent[next] !== -1 || !passable(p)) continue;
      parent[next] = index; queue.push(next);
      if (next === goal) {
        let step = next; while (parent[step] !== start) step = parent[step];
        return { x: step % width, y: Math.floor(step / width) };
      }
    }
  }
  return { ...from };
}

export function planHunters(run, canEnter) {
  const reserved = [], hard = run.difficulty === 'nemesis';
  return run.hunters.map(original => {
    const hunter = { ...original, attack: [] }, from = hunterPoint(hunter), phase = hunter.boss ? Math.min(3, run.collectedLanterns.length + 1) : 1;
    const passable = p => canEnter(run, p) && !run.crates.some(crate => same(crate, p));
    const distance = Math.abs(run.player.x - from.x) + Math.abs(run.player.y - from.y);
    const covered = run.stage.cover.some(p => same(p, run.player));
    const sees = distance <= (hunter.vision || 7) + (hard ? 2 : 0) + (phase === 3 ? 1 : 0)
      && (!covered || distance <= 2 || run.noise > 0) && lineOfSight(from, run.player, passable);
    const hears = (run.noise > 0 && distance <= 9) || run.alarm > 0;
    hunter.memory = Math.max(0, (hunter.memory || 0) - 1);
    if (sees || hears) { hunter.lastSeen = { ...run.player }; hunter.memory = 5; }
    let target = hunter.lastSeen, mode = hunter.memory ? 'searching' : 'patrolling';
    if (sees || hears) {
      mode = 'pursuing'; target = { ...run.player };
      const prediction = predictMove(run.memory), dash = prediction.action.startsWith('dash-');
      const vector = vectors[prediction.action.replace('dash-', '')];
      if (prediction.ready && prediction.confidence >= .42 && vector) {
        for (let i = 0; i < (dash && run.energy >= 2 ? 2 : 1); i++) {
          const p = { x: target.x + vector[0], y: target.y + vector[1] };
          if (!passable(p)) break; target = p;
        }
        mode = 'intercepting';
      }
    }
    if (run.lure && run.lure.until > run.turns && Math.abs(run.lure.x - from.x) + Math.abs(run.lure.y - from.y) <= 12) {
      target = { x: run.lure.x, y: run.lure.y }; mode = 'distracted';
    } else if (run.cargoPoint && !run.cargoDelivered && Math.abs(run.cargoPoint.x - from.x) + Math.abs(run.cargoPoint.y - from.y) <= 12) {
      target = { ...run.cargoPoint }; mode = 'following relic';
    } else if (!hunter.memory) {
      target = hunter.route[hunter.patrolIndex || 0];
      if (same(from, target)) hunter.patrolIndex = ((hunter.patrolIndex || 0) + 1) % hunter.route.length;
      target = hunter.route[hunter.patrolIndex || 0];
    }
    const cadence = hard || phase > 1 ? 4 : 3;
    if (run.stun > 1 || (run.turns + 1) % cadence === 0) {
      hunter.intent = from; hunter.mode = run.stun > 1 ? 'stunned' : 'recovering';
    } else if (hunter.boss && phase > 1 && hunter.memory && (run.turns + 1) % 5 === 0) {
      const deltaX = target.x - from.x, deltaY = target.y - from.y;
      const [dx, dy] = Math.abs(deltaX) >= Math.abs(deltaY) ? [Math.sign(deltaX) || 1, 0] : [0, Math.sign(deltaY) || 1];
      for (let i = 1; i <= phase + 1; i++) {
        const point = { x: from.x + dx * i, y: from.y + dy * i };
        if (!passable(point)) break; hunter.attack.push(point);
      }
      hunter.intent = from; hunter.mode = 'charging sweep';
    } else {
      const point = nextPathStep(from, target || from, run.stage.map.width, run.stage.map.height,
        p => passable(p) && !reserved.some(other => same(other, p)));
      hunter.intent = point; hunter.mode = mode;
    }
    hunter.phase = phase; reserved.push(hunter.intent); return hunter;
  });
}
