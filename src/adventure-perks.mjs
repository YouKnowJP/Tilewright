export const PERKS = Object.freeze([
  { id: 'quiet', name: 'Quiet boots', description: 'Dash noise fades after one turn instead of three.' },
  { id: 'charge', name: 'Spring soles', description: 'Walking and waiting restore two energy.' },
  { id: 'ward', name: 'Woven ward', description: 'Shields protect for four turns instead of three.' },
  { id: 'forager', name: 'Lantern nectar', description: 'Restoring a lantern also restores one heart.' },
  { id: 'provision', name: 'Deep pockets', description: 'Receive an extra decoy and shield at each new leg.' },
  { id: 'scout', name: 'Scout glass', description: 'Reveal a wider circle of the map.' },
  { id: 'sturdy', name: 'Second wind', description: 'Gain one extra protected turn after taking damage.' },
  { id: 'decoy', name: 'Echo lantern', description: 'Decoys distract enemies for seven following turns.' },
  { id: 'chorus', kit: 'bellrunner', name: 'Lingering chorus', description: 'Pulse dazes for three turns; casting recharges in eight turns. Combine with a Resonant buckle for protected crossings.' },
  { id: 'resonant-ward', kit: 'bellrunner', name: 'Resonant buckle', description: 'Pulse also wards you for two turns, but casting costs all three energy.' },
  { id: 'soft-step', kit: 'mistweaver', name: 'Long dusk ribbon', description: 'Veil lasts six turns; ordinary decoys last only three. Echo lantern restores their longer lifetime.' },
  { id: 'moon-thread', kit: 'mistweaver', name: 'Moon thread', description: 'Veil recharges in four turns, but lasts one turn less. Combine with Long dusk ribbon for longer cover.' },
  { id: 'anchor', kit: 'echoist', name: 'Memory anchor', description: 'Doubles last ten turns. Returning costs two energy instead of one.' },
  { id: 'afterglow', kit: 'echoist', name: 'Homeward afterglow', description: 'Returning to a double grants a two-turn ward; casting recharges in eight turns. The ward protects the return itself.' },
]);
export const VOWS = Object.freeze([
  { id: 'none', name: 'Open trail', description: 'Use every tool at your disposal.', bonus: 0 },
  { id: 'treasure', name: 'Treasure oath', description: 'Recover every coin before leaving each leg.', bonus: 150 },
  { id: 'quiet', name: 'Measured steps', description: 'No dashes. Cover and supplies matter more.', bonus: 175 },
  { id: 'unwarded', name: 'Unwarded', description: 'No shields. Dodge, distract, and time your crossings.', bonus: 200 },
]);
export const validPerks = values => Array.isArray(values) && values.length <= PERKS.length
  && new Set(values).size === values.length && values.every(id => PERKS.some(perk => perk.id === id));
export function perkEffects(perks = []) {
  if (!validPerks(perks)) throw new Error('Choose known, unique expedition upgrades.');
  const has = id => perks.includes(id);
  return { dashNoise: has('quiet') ? 1 : 3, recharge: has('charge') ? 2 : 1, shieldTurns: has('ward') ? 4 : 3,
    lanternHealing: has('forager') ? 1 : 0, provision: has('provision') ? 1 : 0,
    sightSquared: has('scout') ? 49 : 30, protection: has('sturdy') ? 1 : 0, decoyTurns: has('decoy') ? 7 : has('soft-step') ? 3 : 5,
    ...(has('chorus') || has('resonant-ward') || has('soft-step') || has('moon-thread') || has('anchor') || has('afterglow') ? {
      powerRecharge: has('chorus') || has('afterglow') ? 8 : has('moon-thread') ? 4 : 6,
      powerEnergy: has('resonant-ward') ? 3 : 2, pulseTurns: has('chorus') ? 3 : 2, pulseWard: has('resonant-ward') ? 2 : 0,
      veilTurns: (has('soft-step') ? 6 : 4) - Number(has('moon-thread')), echoTurns: has('anchor') ? 10 : 6,
      returnEnergy: has('anchor') ? 2 : 1, returnWard: has('afterglow') ? 2 : 0,
    } : {}) };
}
