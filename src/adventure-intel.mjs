import { hazardActive, enemyIntent, canEnter } from './adventure.mjs';
import { kitFor, powerPreview, waystonePreview } from './adventure-tools.mjs';
const at = point => `column ${point.x + 1}, row ${point.y + 1}`;
export function threatForecast(run) {
  const near = point => (point.x - run.player.x) ** 2 + (point.y - run.player.y) ** 2 <= run.effects.sightSquared;
  const lines = [`You: ${at(run.player)}. Health ${run.health}/3; energy ${run.energy}/3.`,
    run.carrying ? 'The carried relic is audible. Set it down with X to create a false trail.' : 'Waiting spends a turn. Reading this forecast does not.'];
  for (const hunter of run.hunters.filter(near)) {
    lines.push(`${hunter.boss ? 'Watcher' : 'Hunter'} at ${at(hunter)}: ${hunter.mode}; next step ${at(hunter.intent)}.`);
    if (hunter.attack.length) lines.push(`Marked sweep: ${hunter.attack.map(at).join('; ')}. Leave these cells or shield before acting.`);
  }
  for (const enemy of run.enemies) {
    const point = enemy.route[enemy.index];
    if (near(point)) lines.push(`Patrol at ${at(point)}: next route cell ${at(enemyIntent(run, enemy).point)}. Changing a crossing can block it.`);
  }
  const burning = run.stage.hazards.filter(point => near(point) && hazardActive(run, point, run.turns + 1));
  if (burning.length) lines.push(`Embers burn next turn: ${burning.map(at).join('; ')}.`);
  if (!run.hunters.some(near) && !run.enemies.some(enemy => near(enemy.route[enemy.index])) && !burning.length) lines.push('No visible next-turn enemy or ember warning nearby. Unexplored areas may contain other dangers.');
  for (const item of run.stage.switches.filter(near)) lines.push(`${item.name} at ${at(item)}: ${run.switches[item.id] ? 'on' : 'off'}. ${item.description}`);
  if (run.guild) {
    lines.push(`${kitFor(run).power}: ${powerPreview(run, canEnter, hazardActive)}`);
    if (run.guild.veilUntil > run.turns) lines.push(`Mist veil: ${run.guild.veilUntil - run.turns} turns left.${run.carrying || run.alarm ? ' Cargo or alarm reveals you.' : ' Hunters retain their previous lead and committed move.'}`);
    for (const stone of run.stage.waystones.filter(near)) lines.push(`${stone.name}: ${waystonePreview(run, stone, canEnter, hazardActive)}`);
  }
  if (run.stage.restrictions.noDash) lines.push('Measured steps oath: dashes are disabled.');
  if (run.stage.restrictions.noShield) lines.push('Unwarded oath: shields are disabled.');
  return lines;
}
