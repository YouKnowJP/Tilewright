export const GUILD_KITS = Object.freeze([
  { id: 'bellrunner', name: 'Bellrunner', power: 'Resonance pulse', description: 'Halt reachable hunters within four steps for this turn and the next. Contact and embers still hurt. Start with more shields.' },
  { id: 'mistweaver', name: 'Mistweaver', power: 'Mist veil', description: 'Hide from new sight and ordinary dash noise for four turns. Existing plans and recent leads remain dangerous. Cargo and alarms reveal you. Start with more decoys.' },
  { id: 'echoist', name: 'Echoist', power: 'Lantern double', description: 'Leave a double that lures hunters and holds a pressure plate for six more turns. Use B again to return to it for one energy. Hunters extinguish doubles they reach; committed moves still resolve.' },
]);
export const kitFor = run => GUILD_KITS.find(kit => kit.id === run.guild?.kit);
export const liveEcho = run => run.guild?.echo?.until > run.turns ? run.guild.echo : null;
export const powerCost = run => liveEcho(run) ? run.effects.returnEnergy || 1 : run.effects.powerEnergy || 2;
export function powerProblem(run, canEnter) {
  if (!run.guild) return 'Choose a specialist in the Guild, Expedition hub, or World studio to use this power.';
  const echo = liveEcho(run);
  if (echo) {
    if (!canEnter?.(run, echo) || run.crates.some(item => item.x === echo.x && item.y === echo.y)) return 'The double’s return cell is blocked. No turn or energy spent.';
    if ([...run.hunters, ...run.enemies.map(enemy => enemy.route[enemy.index])].some(item => item.x === echo.x && item.y === echo.y)) return 'A hunter occupies the double. No turn or energy spent.';
    return run.energy < powerCost(run) ? `Returning to the double needs ${powerCost(run)} energy. Walk or wait to recharge.` : null;
  }
  if (run.turns < run.guild.readyAt) return `Recharges in ${run.guild.readyAt - run.turns} turns.`;
  if (run.energy < powerCost(run)) return powerCost(run)===2?'Needs two energy. Walk or wait to recharge.':`Needs ${powerCost(run)} energy. Walk or wait to recharge.`;
  return null;
}
export function powerPreview(run, canEnter, hazardActive) {
  const echo = liveEcho(run), problem = powerProblem(run, canEnter);
  if (!echo) return problem || `Ready: ${powerCost(run)} energy, one turn; ${run.effects.powerRecharge || 6}-turn recharge.${run.guild.kit==='echoist'?` The double lasts ${run.effects.echoTurns || 6} more turns, holds plates, and lures hunters within twelve cells.`:run.guild.kit==='mistweaver'?` Veil lasts ${run.effects.veilTurns || 4} turns.`:` Pulse dazes for ${run.effects.pulseTurns || 2} turns.${run.effects.pulseWard?' Also grants a two-turn ward.':''}`}`;
  const same = point => point.x === echo.x && point.y === echo.y;
  const enemy = run.hunters.some(hunter => same(hunter.intent) || hunter.attack.some(same)) || run.enemies.some(enemy => enemy.route.some(same));
  const fire = run.stage.hazards.some(hazard => same(hazard) && hazardActive(run, hazard, run.turns + 1));
  return `Double: column ${echo.x + 1}, row ${echo.y + 1}; ${echo.until - run.turns} turns left. ${problem || `Return: ${powerCost(run)} energy, one turn; consumes the double.${run.effects.returnWard?' Grants a two-turn ward.':''}`}${enemy ? ' Enemy movement or a sweep threatens the return; inspect Plan.' : ''}${fire ? ' The return cell burns next turn!' : ''} Reading does not spend its lifetime.`;
}
export function pulseCells(run, canEnter) {
  const cells = [run.player], seen = new Set([`${run.player.x},${run.player.y}`]);
  for (let i = 0; i < cells.length; i++) {
    const from = cells[i];
    if ((from.distance || 0) === 4) continue;
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const point = { x: from.x + dx, y: from.y + dy, distance: (from.distance || 0) + 1 }, key = `${point.x},${point.y}`;
      if (!seen.has(key) && canEnter(run, point) && !run.crates.some(crate => crate.x === point.x && crate.y === point.y)) { seen.add(key); cells.push(point); }
    }
  }
  return cells;
}
export function waystoneProblem(run, stone, canEnter) {
  const destination = run.stage.waystones?.find(item => item.id === stone.partner);
  if (!destination || !canEnter(run, destination) || run.crates.some(item => item.x === destination.x && item.y === destination.y)) return 'The destination is blocked. No turn or energy spent.';
  if ([...run.hunters, ...run.enemies.map(enemy => enemy.route[enemy.index])].some(item => item.x === destination.x && item.y === destination.y)) return 'A hunter occupies the destination. Wait for it to clear.';
  if (run.energy < 1) return 'Waystone travel needs one energy. Walk or wait to recharge.';
  return null;
}
export function waystonePreview(run, stone, canEnter, hazardActive) {
  const destination = run.stage.waystones.find(item => item.id === stone.partner), problem = waystoneProblem(run, stone, canEnter);
  if (problem) return problem;
  const same = item => item.x === destination.x && item.y === destination.y;
  const enemies = run.hunters.some(hunter => same(hunter.intent) || hunter.attack.some(same)) || run.enemies.some(enemy => enemy.route.some(same));
  const fire = run.stage.hazards.some(hazard => same(hazard) && hazardActive(run, hazard, run.turns + 1));
  return `${destination.name}: column ${destination.x + 1}, row ${destination.y + 1}. One energy, one turn.${enemies ? ' Enemy movement or a sweep threatens the landing; inspect Plan or wait.' : ''}${fire ? ' The landing burns next turn!' : ''}${!enemies && !fire ? ' No committed hunter or ember threat at the landing.' : ''} Travel can collect items and deliver cargo.`;
}
export function validateTools(stage) {
  if (!stage.guild) return;
  const stones = stage.waystones || [], ids = new Set(stones.map(item => item.id));
  if (!GUILD_KITS.some(kit => kit.id === stage.guild.kit) || !Array.isArray(stage.guild.merits) || stage.guild.merits.length !== 3
    || new Set(stage.guild.merits).size !== 3 || stage.guild.merits.some(id => !['clean', 'treasure', 'power', 'travel', 'swift'].includes(id))
    || stones.length > 8 || ids.size !== stones.length || stones.some(stone => !/^[a-z0-9-]{1,40}$/.test(stone.id)
      || typeof stone.name !== 'string' || stone.partner === stone.id || !stones.some(other => other.id === stone.partner && other.partner === stone.id)
      || [...stage.npcs, ...stage.switches, ...stage.relays, ...stage.supplies, ...stage.gates, ...(stage.relic ? [stage.relic] : [])].some(other => other.id === stone.id || (other.x === stone.x && other.y === stone.y))
      || stones.some(other => other.id !== stone.id && other.x === stone.x && other.y === stone.y))) throw Error('Guild tools need a known kit, three distinct merits, and unique paired waystones.');
}
