// Reversible world controls. A closed bridge never removes an occupied floor.
export const switchGateOpen = (run, gate) => gate.controls.every(control => Boolean(run.switches[control.id]) === control.on);
export const wallet = run => run.collectedCoins.length - run.spentCoins;
export function choiceProblem(run, choice) {
  if (wallet(run) < (choice.cost || 0)) return `Needs ${choice.cost} unspent coins; you have ${wallet(run)}.`;
  const effect = choice.effect || {};
  if (choice.cost && !(effect.decoys > 0 && run.decoys < 3) && !(effect.shields > 0 && run.shields < 3)
    && !(effect.health > 0 && run.health < 3) && !Object.entries(effect.switches || {}).some(([id, value]) => run.switches[id] !== value)) return 'Already fully stocked for this parcel.';
  return switchChange(run, effect.switches || {}).error || null;
}
export function choiceAvailable(run, choice) { return !choiceProblem(run, choice); }
export function switchChange(run, patch) {
  const switches = { ...run.switches, ...patch }, next = { ...run, switches };
  const occupied = [run.player, ...run.crates, ...run.companions, ...run.hunters,
    ...run.enemies.map(enemy => enemy.route[enemy.index])];
  const blocked = run.stage.gates.find(gate => gate.type === 'switch' && switchGateOpen(run, gate) && !switchGateOpen(next, gate)
    && occupied.some(point => point.x === gate.x && point.y === gate.y));
  return blocked ? { error: 'That crossing is occupied. Move clear or let the patrol pass before changing the water.' } : { switches };
}
export function mechanismPreview(run, mechanism) {
  const change = switchChange(run, { [mechanism.id]: !run.switches[mechanism.id] });
  if (change.error) return change.error;
  const next = { ...run, switches: change.switches };
  let opens = 0, closes = 0;
  for (const gate of run.stage.gates.filter(gate => gate.type === 'switch')) {
    const before = switchGateOpen(run, gate), after = switchGateOpen(next, gate);
    opens += Number(!before && after); closes += Number(before && !after);
  }
  const hazards = run.stage.hazards.filter(hazard => hazard.disabledBy === mechanism.id).length;
  return `${mechanism.name}: ${run.switches[mechanism.id] ? 'on → off' : 'off → on'}. ${opens} crossing cells open; ${closes} close.${hazards ? ` ${hazards} ember cells ${next.switches[mechanism.id] ? 'switch off' : 'switch on'}.` : ''} Uses one turn. ${mechanism.description || ''}`;
}
export function validateMechanisms(stage) {
  const ids = new Set(stage.switches.map(item => item.id));
  if (ids.size !== stage.switches.length || stage.switches.some(item => !/^[a-z0-9-]{1,40}$/.test(item.id)
    || typeof item.name !== 'string' || typeof item.initial !== 'boolean' || (item.operable !== undefined && typeof item.operable !== 'boolean'))
    || stage.requiredSwitches.some(id => !ids.has(id))
    || stage.gates.some(gate => gate.type === 'switch' && (!Array.isArray(gate.controls) || !gate.controls.length
      || gate.controls.some(control => !ids.has(control.id) || typeof control.on !== 'boolean')))
    || stage.hazards.some(hazard => hazard.disabledBy && !ids.has(hazard.disabledBy))
    || stage.npcs.some(npc => (npc.choices || []).some(choice => (choice.cost !== undefined && (!Number.isInteger(choice.cost) || choice.cost < 0 || choice.cost > stage.coins.length))
      || Object.entries(choice.effect?.switches || {}).some(([id, value]) => !ids.has(id) || typeof value !== 'boolean')))) {
    throw new Error('Mission switches, crossings, trades, and hazard controls must be valid.');
  }
}
