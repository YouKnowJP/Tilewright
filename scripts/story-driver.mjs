// Authoring tool: every step uses public rules; no run-state mutation.
import { createCampaign } from '../src/adventure-levels.mjs';
import { createRun, stepRun, resultFor } from '../src/adventure.mjs';
import { routes, localPath } from './solve-expeditions.mjs';
export function storyDriver(id, difficulty = 'trail', definition = null) {
  let run = createRun(definition || createCampaign().find(stage => stage.id === id), { difficulty }); const actions = [];
  const act = action => {
    const next = stepRun(run, action);
    if (next.damage > run.damage && action.startsWith('interact:') && run.shields && !run.stage.restrictions.noShield) {
      run = stepRun(run, 'shield'); actions.push('shield');
    }
    run = stepRun(run, action); actions.push(action);
    if (run.status === 'lost') throw new Error(`Lost ${id} on ${action} at ${JSON.stringify(run.player)}.`);
  };
  const same = (a, b) => a.x === b.x && a.y === b.y;
  const go = target => {
    for (let tries = 0; !same(run.player, target) && run.status === 'playing'; tries++) {
      if (tries > 160) throw Error('Navigation did not converge.');
      const path = routes(run, target).path; let moves, error;
      for (const reach of [5, 2, 0]) {
        try { moves = localPath(run, path[Math.min(path.length - 1, reach)], reach === 0 ? 16000 : 4000, { clean: true }); break; }
        catch (failure) { error = failure; }
      }
      if (!moves) throw error; moves.forEach(act);
    }
  };
  const interact = id => {
    const target = [...run.stage.switches, ...run.stage.relays, ...(run.stage.waystones || []), ...run.stage.supplies, ...(run.stage.relic ? [run.stage.relic] : [])].find(item => item.id === id);
    go(target);
    for (let attempt = 0; attempt < 20; attempt++) {
      // Interacting also advances the world. If a ward is exhausted, approach
      // from a safe adjacent tile instead of forcing an avoidable hit.
      if (stepRun(run, `interact:${id}`).damage > run.damage && (!run.shields || run.stage.restrictions.noShield)) {
        const alternatives = [];
        for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
          const point = { x: target.x + dx, y: target.y + dy }; if (same(point, run.player)) continue;
          try {
            const moves = localPath(run, point, 8000, { clean: true }), next = moves.reduce(stepRun, run);
            if (stepRun(next, `interact:${id}`).damage === run.damage) alternatives.push(moves);
          } catch { /* Try another ordinary approach. */ }
        }
        alternatives.sort((a, b) => a.length - b.length);
        if (!alternatives.length) throw Error(`No clean interaction approach for ${id}.`);
        alternatives[0].forEach(act);
      }
      const turn = run.turns; act(`interact:${id}`);
      if (run.turns !== turn) return;
      if (!/occupied|occupies/.test(run.message)) throw Error(`Cannot use ${id}: ${run.message}`);
      const options = ['wait', 'shield', 'decoy', 'up', 'right', 'down', 'left'].map(action => ({ action, next: stepRun(run, action) }))
        .filter(({ next }) => next.turns > run.turns && next.status === 'playing' && Math.abs(next.player.x - target.x) + Math.abs(next.player.y - target.y) <= 1)
        .sort((a, b) => a.next.damage - b.next.damage || b.next.health - a.next.health);
      if (!options.length) throw Error('No safe wait beside the occupied crossing.'); act(options[0].action);
    }
    throw Error(`Crossing did not clear for ${id}.`);
  };
  const talk = (id, choice) => {
    const target = run.stage.npcs.find(npc => npc.id === id), distance = routes(run).distance;
    const points = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => ({ x: target.x + dx, y: target.y + dy }))
      .filter(point => distance[point.y * run.stage.map.width + point.x] >= 0).sort((a, b) => distance[a.y * run.stage.map.width + a.x] - distance[b.y * run.stage.map.width + b.x]);
    go(points[0]); act(`interact:${id}`); if (choice) act(`choose:${choice}`); act('close-dialogue');
  };
  return { act, go, interact, talk, get run() { return run; }, finish(branch) { go(run.stage.exit); if (run.status === 'playing') act('wait'); if (run.status !== 'won') throw Error(`Incomplete ${id}: ${run.message}`); return { id, difficulty, branch, actions, result: resultFor(run), damage: run.damage, choices: run.choices }; } };
}
