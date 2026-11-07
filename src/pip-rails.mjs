// New owned material. See LICENSE; prior MIT permissions remain effective.
import {CLOCKWORK_LABELS, transformProgram} from './clockwork.mjs';

const channels = ['amber', 'jade', 'violet', 'blue'];
export const RAIL_DIRECTIONS = Object.freeze({up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0]});

export function normalizeRail(raw) {
  const {channel, quietExit = 'right', poweredExit = 'down'} = raw || {};
  if (!channels.includes(channel) || typeof quietExit !== 'string' || typeof poweredExit !== 'string' ||
      !Object.hasOwn(RAIL_DIRECTIONS, quietExit) || !Object.hasOwn(RAIL_DIRECTIONS, poweredExit)) {
    throw Error('A Switch Rail needs a power channel and two direction exits.');
  }
  return {channel, quietExit, poweredExit};
}

export function transformRailExits(rail, operation) {
  const [quietExit, poweredExit] = transformProgram([rail.quietExit, rail.poweredExit, 'wait'], operation);
  return {quietExit, poweredExit};
}

export function railDescription(raw) {
  const rail = normalizeRail(raw);
  return `Quiet ${CLOCKWORK_LABELS[rail.quietExit]} · Powered ${CLOCKWORK_LABELS[rail.poweredExit]} · ${channels.indexOf(rail.channel) + 1} ${rail.channel}. Enter to ride next turn without spending a card. Power is read when the ride starts.`;
}
