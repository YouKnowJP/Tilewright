// Winning witnesses are produced exclusively with the public turn rules.
import { createCampaign } from '../src/adventure-levels.mjs';
import { createRun, stepRun, resultFor } from '../src/adventure.mjs';
import { routes, localPath } from './solve-expeditions.mjs';
export function solveSluice(id, difficulty = 'trail', branch = 0) {
  let run = createRun(createCampaign().find(stage => stage.id === id), { difficulty }); const actions = [];
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
        try { moves = localPath(run, path[Math.min(path.length - 1, reach)], reach === 0 ? 16000 : 4000); break; }
        catch (failure) { error = failure; }
      }
      if (!moves) throw error; moves.forEach(act);
    }
  };
  const interact = id => {
    const target = [...run.stage.switches, ...run.stage.relays, ...(run.stage.relic ? [run.stage.relic] : [])].find(item => item.id === id);
    go(target);
    for (let attempt = 0; attempt < 20; attempt++) {
      const turn = run.turns; act(`interact:${id}`);
      if (run.turns !== turn) return;
      if (!/occupied/.test(run.message)) throw Error(`Cannot use ${id}: ${run.message}`);
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
  const stage = run.stage;
  if (id === 'trail-7') {
    talk('luma', branch ? 'supplies' : 'ferry'); go(stage.lanterns[0]); interact('intake');
    go({ x: 14, y: branch ? 5 : 10 }); go(stage.lanterns[1]); interact('spillway'); go(stage.lanterns[2]);
    go({ x: 10, y: branch ? 14 : 10 });
  } else if (id === 'trail-8') {
    talk('sen');
    if (branch !== 2) { go(stage.coins[0]); go(stage.coins[1]); talk('rook', branch ? 'shield' : 'decoys'); }
    go(stage.lanterns[0]); interact('dew'); interact('glass');
    if (!branch) interact('moss');
    go({ x: 16, y: branch ? 6 : 11 }); interact('vent'); go(stage.lanterns[1]); interact('sun'); go(stage.lanterns[2]);
  } else if (id === 'trail-9') {
    talk('iona', branch ? 'prepare' : 'shelter'); go(stage.lanterns[0]); go(stage.keys[0]); interact('root');
    go({ x: 19, y: 16 }); interact('moor'); interact('tide'); go(stage.lanterns[1]); go(stage.lanterns[2]);
    talk('sola'); talk('jun'); interact('relic'); go({ x: 15, y: 7 });
  } else throw Error('Choose a sluice saga mission.');
  go(stage.exit); if (run.status !== 'won') act('wait');
  if (run.status !== 'won') throw Error(`Incomplete mission: ${run.message} ${JSON.stringify(run.switches)}`);
  return { id, difficulty, branch, actions, result: resultFor(run), damage: run.damage, switches: run.switches, spentCoins: run.spentCoins };
}
