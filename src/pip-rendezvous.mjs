// New owned material. See LICENSE; prior MIT permissions remain effective.

export function meetingTurn(firstArrival, secondArrival) {
  if ([firstArrival, secondArrival].some(turn => !Number.isSafeInteger(turn) || turn < 1 || turn >= Number.MAX_SAFE_INTEGER)) {
    throw Error('Choose two positive arrival turns.');
  }
  return Math.max(firstArrival, secondArrival) + 1;
}

export function readyRendezvous(state, parts) {
  const [first, second] = state.bots;
  if (!first?.syncing || !second?.syncing) return false;
  const postAt = bot => parts.find(part => part.kind === 'sync' && part.x === bot.x && part.y === bot.y);
  const a = postAt(first), b = postAt(second);
  return Boolean(a && b && a !== b && a.channel === b.channel);
}

export function rendezvousDescription(part) {
  const number = ['amber', 'jade', 'violet', 'blue'].indexOf(part.channel) + 1;
  return `Wait here for the other link ${number} · ${part.channel} post. When both couriers have arrived, they resume on the next turn with their cards and parcels held.`;
}
