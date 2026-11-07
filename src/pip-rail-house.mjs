// New owned material. See LICENSE; prior MIT permissions remain effective.
const point = (x, y) => ({x, y});
const row = (y, first, last) => Array.from({length: last - first + 1}, (_, i) => point(first + i, y));
const column = (x, first, last) => Array.from({length: last - first + 1}, (_, i) => point(x, first + i));
const road = (...segments) => [...new Map(segments.flat().map(cell => [`${cell.x},${cell.y}`, cell])).values()];
const part = (kind, x, y, fields = {}) => ({kind, x, y, ...fields});
const well = (x, y, channel) => part('source', x, y, {channel});
const window = (x, y, channel, parcels = 1) => part('receiver', x, y, {channel, parcels});
const rail = (x, y, quietExit, poweredExit = quietExit, channel = 'amber') => part('rail', x, y, {channel, quietExit, poweredExit});
const press = (x, y, channel, output) => part('press', x, y, {channel, output});
const east = ['right', 'right', 'use'];
const pace = ['right', 'left', 'wait'];
const blank = ['wait', 'wait', 'wait'];

const scenes = [
  {
    id: 'duo-rail-sidecar', title: 'The Sidecar Crossing', width: 8, height: 5,
    difficulty: 'Expert', minutes: '10–20 min',
    story: 'Moss: “Two rides, then let the next card do its work.” Sprout’s second footfall sends Pip down to the parcel press. Lay the rails so they carry Pip across the bend without spending a movement card.',
    hint: 'Pip East / East / Use. Sprout East / West / Wait. Sprout counter (2,5): amber, every 2 arrivals, 0 starting marks, 2 powered turns. Rail (4,2): amber, quiet East and powered South. Rail (4,3): East in both states. Press (6,3): amber → jade. Ride on 5 and 6, press on 8 and deliver on 11.',
    ending: 'Moss hears the little wheels cross the bend. When the ride is over, Pip still has the very same card waiting.',
    road: road(row(1, 0, 3), row(2, 3, 7), row(4, 0, 1)), starts: [point(0, 1), point(0, 4)],
    solution: [east, pace],
    fixed: [well(2, 1, 'amber'), window(7, 2, 'jade')],
    solutionParts: [rail(3, 1, 'right', 'down'), rail(3, 2, 'right'), press(5, 2, 'amber', 'jade'),
      part('counter', 1, 4, {channel: 'amber', threshold: 2, phase: 0, duration: 2, courier: 'sprout'})],
  },
  {
    id: 'duo-rail-switchback', title: 'The Window Switchback', width: 9, height: 6,
    difficulty: 'Master', minutes: '20–40 min',
    story: 'Tavi: “One letter changes the whole journey.” Fill the upper amber window first. Its light redirects the same rail on Pip’s second visit. The long return line holds the next card through every ride. Sprout brings a blue letter and waits at the lower flag.',
    hint: 'Both East / East / Use. Rail (4,3): amber, quiet North and powered South. Fit the missing return rails at (7,2) North, (5,1) West and (1,2) South in both states. Lower rail (2,6) East in both states. Press (5,4): amber → jade. The upper amber delivery on 7 powers the second junction visit. Sprout parks at (7,6). The last letter arrives on 29.',
    ending: 'Tavi lifts the new letter beside the old one. Its light made a different road out of the same three cards.',
    road: road(row(0, 0, 6), row(1, 3, 6), point(0, 1), row(2, 0, 3), row(3, 3, 6), row(5, 0, 6)),
    starts: [point(0, 2), point(0, 5)], solution: [east, east],
    fixed: [well(2, 2, 'amber'), window(4, 1, 'amber'), window(6, 3, 'jade'), well(3, 5, 'blue'), window(5, 5, 'blue'),
      part('sprout-dock', 6, 5), rail(0, 0, 'down'), ...[1, 2, 3, 5, 6].map(x => rail(x, 0, 'left'))],
    solutionParts: [rail(3, 2, 'up', 'down'), rail(6, 1, 'up'), rail(4, 0, 'left'), rail(0, 1, 'down'), rail(1, 5, 'right'), press(4, 3, 'amber', 'jade')],
  },
  {
    id: 'duo-rail-dispatch', title: 'The Delayed Dispatch', width: 9, height: 6, handoffs: 1,
    difficulty: 'Master', minutes: '25–50 min',
    story: 'Nessa: “One beat has to make it to two places.” Sprout’s first counted arrival sends a delayed beat to its junction and to Pip’s kiln. Keep that beat long enough for the recipe. Sprout needs Use at the cargo compass to climb in time. Meet at the handoff and carry the finished letter to the lower window.',
    hint: 'Both East / East / Use. Sprout counter (2,5): amber, every 3, 2 starting marks, 3 powered turns, Sprout. Drum (9,1): amber → jade, delay 3. Pip rail (4,2): South in both states. Sprout rail (4,5): jade, quiet North and powered East. Next rail (5,5): North in both states. Kiln (5,3): jade power, amber → quiet blue / powered jade. Power starts on 5, kiln on 7, compass on 8, handoff on 10 and delivery on 11.',
    ending: 'Nessa taps the last little beat into the desk. The letter has been carried by two couriers and a road that kept time.',
    road: road(row(1, 0, 3), row(2, 3, 6), row(3, 4, 5), row(4, 0, 4), point(5, 1), point(8, 0)),
    starts: [point(0, 1), point(0, 4)], solution: [east, east],
    fixed: [well(2, 1, 'amber'), part('handoff', 6, 2), window(5, 1, 'jade'),
      part('cargo', 5, 3, {channel: 'any', program: ['up', 'up', 'use'], alternate: blank})],
    solutionParts: [rail(3, 1, 'down'), rail(3, 4, 'up', 'right', 'jade'), rail(4, 4, 'up'),
      part('counter', 1, 4, {channel: 'amber', threshold: 3, phase: 2, duration: 3, courier: 'sprout'}),
      part('drum', 8, 0, {input: 'amber', channel: 'jade', delay: 3}),
      part('kiln', 4, 2, {channel: 'jade', input: 'amber', quiet: 'blue', powered: 'jade'})],
  },
  {
    id: 'duo-rail-foundry', title: 'The Roundabout Foundry', width: 13, height: 9, quietSwitches: true,
    difficulty: 'Master', minutes: '35–65 min',
    story: 'Eid: “Take the north branch first. Then take the south, and the bowl will remember both.” Work both recipes twice. The lantern swaps the branch each lap. Deliver two violet blends and finish with the lantern off and both couriers home.',
    hint: 'Both East / East / Use. Fork (5,5): violet, quiet North and powered South. Return rails (7,4) South and (7,6) North in both states. Presses (6,4) amber → jade and (6,6) amber → blue. Bowl (8,5): jade + blue → violet. Violet lantern (12,7) changes the next lap. Clockwise vanes at (12,5),(12,8),(2,8). Sprout rail (4,2) East in both states. Deliver on 55 and 137. Switch violet off on 143 and finish at both flags on 147.',
    ending: 'Eid marks off two violet blends, shuts the last lantern and leaves the roundabout ready for another pair.',
    road: road(row(4, 1, 11), row(7, 1, 11), column(1, 4, 7), column(11, 4, 7), row(3, 4, 6), row(5, 4, 6), row(1, 0, 7)),
    starts: [point(1, 4), point(0, 1)], solution: [east, east],
    fixed: [well(3, 4, 'amber'), window(9, 4, 'violet', 2), part('pip-dock', 9, 7),
      well(2, 1, 'blue'), window(5, 1, 'blue'), part('sprout-dock', 7, 1), part('vane', 1, 4, {operation: 'rotate'})],
    solutionParts: [rail(4, 4, 'up', 'down', 'violet'), rail(6, 3, 'down'), rail(6, 5, 'up'), rail(3, 1, 'right'),
      press(5, 3, 'amber', 'jade'), press(5, 5, 'amber', 'blue'),
      part('mixer', 7, 4, {channel: 'jade', second: 'blue', output: 'violet'}), part('latch', 11, 6, {channel: 'violet'}),
      ...[[11, 4], [11, 7], [1, 7]].map(([x, y]) => part('vane', x, y, {operation: 'rotate'}))],
  },
];

export const RAIL_HOUSE_MISSIONS = Object.freeze(scenes.map((mission, index) => {
  const inventory = {};
  for (const station of mission.solutionParts) inventory[station.kind] = (inventory[station.kind] || 0) + 1;
  return Object.freeze({
    version: 17, chapter: 89 + index, collection: 'rail-house', handoffs: 0, relays: 0,
    emptyLockers: false, quietSwitches: false, quietBells: false, quietDrums: false,
    programs: [blank, blank], ...mission, budget: mission.solutionParts.length, inventory,
  });
}));
