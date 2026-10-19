import { createGuildJobs, guildMerits } from '../src/adventure-guild.mjs';
import { storyDriver } from './story-driver.mjs';
import { stepRun } from '../src/adventure.mjs';
function planCrossing(initial, stone) {
  const queue = [{ run: initial, actions: [] }], seen = new Set();
  for (let cursor = 0; cursor < queue.length && cursor < 18000; cursor++) {
    const { run, actions } = queue[cursor];
    if (run.guild.warps > initial.guild.warps && run.guild.uses) return actions;
    if (actions.length >= 16) continue;
    const key = JSON.stringify([run.player, run.turns % 20, run.energy, run.ward, run.invulnerability, run.decoys, run.shields, run.noise, run.stun,
      Math.max(0, run.guild.readyAt - run.turns), Math.max(0, run.guild.veilUntil - run.turns), Boolean(run.guild.uses),
      run.guild.echo && [run.guild.echo.x, run.guild.echo.y, run.guild.echo.until - run.turns],
      run.lure && [run.lure.x, run.lure.y, run.lure.until - run.turns], run.hunters.map(h => [h.x, h.y, h.intent, h.attack, h.memory, h.lastSeen, h.patrolIndex, Math.max(0, (h.dazedUntil || 0) - run.turns)])]);
    if (seen.has(key)) continue; seen.add(key);
    for (const action of [`interact:${stone.id}`, 'power', 'up', 'right', 'down', 'left', 'wait', 'decoy', 'shield']) {
      const next = stepRun(run, action);
      if (next.turns === run.turns || next.status === 'lost' || next.damage > initial.damage) continue;
      if (next.guild.warps === initial.guild.warps && Math.abs(next.player.x - stone.x) + Math.abs(next.player.y - stone.y) > 4) continue;
      queue.push({ run: next, actions: [...actions, action] });
    }
  }
  throw Error(`No clean crossing found at ${stone.id}.`);
}
export function solveGuild(id, difficulty = 'trail', kit = 'bellrunner', alternate = false) {
  const stage = createGuildJobs(kit).find(stage => stage.id === id), driver = storyDriver(id, difficulty, stage), { go, interact, talk, act } = driver;
  const cross = id => { const stone = stage.waystones.find(stone => stone.id === id); go(stone); planCrossing(driver.run, stone).forEach(act); };
  const coins = indexes => { for (const index of indexes) if (!driver.run.collectedCoins.includes(stage.coins[index].id)) go(stage.coins[index]); };
  const lamp = index => go(stage.lanterns[index]);
  const plateTrip = (x, y) => {
    // Walk around the cart instead of pushing it off its copper stop.
    if (kit === 'echoist') {
      go({ x: x - 2, y: y - 2 }); go({ x, y: y - 2 }); go({ x, y: y - 1 }); go({ x, y });
      while (driver.run.energy < 3) act('wait');
      act('power');
      act('right'); act('dash-right'); act('right'); act('right'); act('power');
      if (!driver.run.guild.swaps) throw Error('The plate trip must actually return to a double.');
      go({ x, y: y - 1 }); go({ x: x - 2, y: y - 1 });
    } else {
      go({ x: x - 2, y: y - 1 }); go({ x: x - 2, y }); act('right');
      go({ x: x - 1, y: y - 1 }); go({ x: x + 1, y: y - 1 }); go({ x: x + 1, y }); go({ x: x + 5, y });
      go({ x: x + 1, y }); go({ x: x + 1, y: y - 1 }); go({ x: x - 2, y: y - 1 });
    }
  };
  if (id === 'guild-1') {
    talk('mira'); lamp(0); coins([0, 1]); cross('orchard-west'); lamp(1); coins([2]); lamp(2); coins([3]); cross('orchard-east');
  } else if (id === 'guild-2') {
    talk('pip'); lamp(0); interact('tick'); go(stage.keys[0]); coins([0, 1]); if (alternate) go({ x: 15, y: 10 }); else cross('hour-west');
    lamp(2); interact('tock'); coins([3, 2]); lamp(1); if (!alternate) { cross('minute-east'); cross('minute-west'); }
  } else if (id === 'guild-3') {
    talk('luma'); lamp(0); cross('reed-west'); lamp(1); lamp(2); talk('sen'); talk('jun'); cross('reed-east');
  } else if (id === 'guild-4') {
    talk('ves'); lamp(0); interact('ink'); coins([1, 0]); cross('folio-west'); lamp(1); coins([2]); lamp(2); coins([3]); interact('echo'); interact('relic'); cross('folio-east');
  } else if (id === 'guild-5') {
    talk('saff'); lamp(0); cross('sun-west'); lamp(1); interact('oasis'); lamp(2); if (!alternate) { cross('shade-east'); cross('shade-west'); }
  } else if (id === 'guild-6') {
    talk('elu'); lamp(0); interact('root'); coins([1, 0]); lamp(1); interact('snow'); cross('dawn-west'); lamp(2); interact('star'); coins([2]); lamp(3); coins([3]); talk('tess'); interact('relic'); cross('dusk-east');
  } else if (id === 'guild-7') {
    talk('ivo', alternate ? 'decoys' : 'shield'); lamp(0); coins([0]); interact('glass'); plateTrip(10, 5);
    cross('glass-west'); lamp(1); coins([1, 2]); interact('glimmer'); lamp(2); cross('glass-east'); coins([3]);
  } else if (id === 'guild-8') {
    talk('ivo', alternate ? 'kit' : 'cool'); lamp(0); interact('mirror'); go(stage.keys[0]); lamp(1);
    if (alternate) plateTrip(12, 6);
    cross('mirror-west'); lamp(2); interact('tide');
    if (!driver.run.switches.rain) interact('rain');
    lamp(3); interact('home'); talk('neri'); interact('relic'); cross('shore-east');
  } else throw Error('Choose a Guild job.');
  const result = driver.finish(0);
  return { ...result, kit, alternate, merits: guildMerits(driver.run), guild: driver.run.guild };
}
