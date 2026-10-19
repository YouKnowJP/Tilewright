export const PERKS = Object.freeze([
  { id: 'quiet', name: 'Quiet boots', description: 'Dash noise fades after one turn instead of three.' },
  { id: 'charge', name: 'Spring soles', description: 'Walking and waiting restore two energy.' },
  { id: 'ward', name: 'Woven ward', description: 'Shields protect for four turns instead of three.' },
  { id: 'forager', name: 'Lantern nectar', description: 'Restoring a lantern also restores one heart.' },
  { id: 'provision', name: 'Deep pockets', description: 'Receive an extra decoy and shield at each new leg.' },
  { id: 'scout', name: 'Scout glass', description: 'Reveal a wider circle of the map.' },
  { id: 'sturdy', name: 'Second wind', description: 'Gain one extra protected turn after taking damage.' },
  { id: 'decoy', name: 'Echo lantern', description: 'Decoys distract enemies for seven following turns.' },
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
    sightSquared: has('scout') ? 49 : 30, protection: has('sturdy') ? 1 : 0, decoyTurns: has('decoy') ? 7 : 5 };
}
