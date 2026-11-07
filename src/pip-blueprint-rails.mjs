// New owned material. See LICENSE; prior MIT permissions remain effective.
import {DUO_CHANNELS} from './pip-duo.mjs';
import {normalizeDuoBlueprint} from './pip-duo-blueprints.mjs';
import {normalizeRail, RAIL_DIRECTIONS} from './pip-rails.mjs';

const same = (a, b) => a.x === b.x && a.y === b.y;
export function blueprintRailStations(input) {
  return normalizeDuoBlueprint(input).parts.flatMap((part, index) => part.kind === 'rail' ? [{...part, index}] : []);
}

export function tuneBlueprintRail(input, index, exits, {all = false} = {}) {
  const piece = normalizeDuoBlueprint(input);
  if (!Number.isInteger(index) || piece.parts[index]?.kind !== 'rail' || typeof all !== 'boolean' ||
      !exits || typeof exits !== 'object' || Array.isArray(exits) ||
      Object.keys(exits).some(key => key !== 'quietExit' && key !== 'poweredExit') ||
      typeof exits.quietExit !== 'string' || typeof exits.poweredExit !== 'string') {
    throw Error('Choose a Switch Rail and two direction exits.');
  }
  const {quietExit, poweredExit} = normalizeRail({...piece.parts[index], ...exits});
  return normalizeDuoBlueprint({...piece, parts: piece.parts.map((part, i) =>
    i === index || all && part.kind === 'rail' ? {...part, quietExit, poweredExit} : part)});
}

export function swapBlueprintRailExits(input) {
  const piece = normalizeDuoBlueprint(input);
  if (!piece.parts.some(part => part.kind === 'rail')) throw Error('Choose a piece with a Switch Rail.');
  return normalizeDuoBlueprint({...piece, parts: piece.parts.map(part => part.kind === 'rail' ?
    {...part, quietExit: part.poweredExit, poweredExit: part.quietExit} : part)});
}

// A route sketch with a constant sample channel. Only the road and rails are simulated.
export function previewBlueprintRide(input, index, powered = '') {
  const piece = normalizeDuoBlueprint(input);
  let station = piece.parts[index];
  if (!Number.isInteger(index) || station?.kind !== 'rail' || powered !== '' && !DUO_CHANNELS.includes(powered)) {
    throw Error('Choose a Switch Rail and a sample power channel.');
  }
  const path = [{x: station.x, y: station.y}];
  while (station) {
    const direction = station.channel === powered ? station.poweredExit : station.quietExit;
    const [dx, dy] = RAIL_DIRECTIONS[direction];
    const target = {x: station.x + dx, y: station.y + dy};
    if (target.x < 0 || target.x >= piece.width || target.y < 0 || target.y >= piece.height) return {path, stop: 'edge', target};
    if (!piece.road.some(cell => same(cell, target))) return {path, stop: 'water', target};
    if (path.some(cell => same(cell, target))) return {path: [...path, target], stop: 'loop'};
    path.push(target);
    station = piece.parts.find(part => part.kind === 'rail' && same(part, target));
  }
  return {path, stop: 'road'};
}
