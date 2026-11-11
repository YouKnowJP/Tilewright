// New owned material. See LICENSE; prior MIT permissions remain effective.
const blank = ['wait', 'wait', 'wait'];
const north = ['up', 'use', 'up'];
const lanes = [
  {x: 0, well: [2, 1], skip: [3, 1], input: 'amber', output: 'jade', bell: 'blue', bridge: 'violet', dock: 'pip-dock'},
  {x: 7, well: [3, 1], skip: [1, 1], input: 'blue', output: 'violet', bell: 'violet', bridge: 'blue', dock: 'sprout-dock'},
];
const road = [], starts = [], fixed = [], solutionParts = [];
for (const lane of lanes) {
  const point = (x, y) => ({x: lane.x + x, y});
  const station = (kind, x, y, settings) => ({kind, ...point(x, y), ...settings});
  for (let y = 1; y <= 7; y++) {
    for (let x = 0; x <= 4; x++) {
      if (x === 0 || x === 4 || y === 1 || y === 7) road.push(point(x, y));
    }
  }
  starts.push(point(0, 2));
  for (const [x, y] of [[0, 1], [4, 1], [4, 7], [0, 7]]) {
    fixed.push(station('vane', x, y, {operation: 'rotate'}));
  }
  fixed.push(
    station(lane.dock, 0, 2),
    station('source', ...lane.well, {channel: lane.input}),
    station('pulse', 4, 5, {channel: lane.bell, duration: 1}),
    station('bridge', 4, 6, {channel: lane.bridge}),
    station('press', 2, 7, {channel: lane.input, output: lane.output}),
    station('receiver', 0, 5, {channel: lane.output, parcels: 3}),
  );
  solutionParts.push(
    station('dial', ...lane.skip, {shift: 'skip'}),
    station('dial', 4, 3, {shift: 'rewind'}),
  );
}

export const CARD_DIAL_FINALE = Object.freeze({
  id: 'duo-dial-finale', chapter: 101, collection: 'dial-finale', version: 20,
  title: 'The Three-Lap Dispatch', width: 13, height: 9, difficulty: 'Master', minutes: '25–50 min',
  story: 'Eid: “Three bags each, and one beat to cross.” Repair the two delivery loops with Card Dials. Each courier rings the other’s bell, presses a parcel and delivers it. Bring both back to their flags after all six letters.',
  hint: 'Both North / Use / North. Skip at (4,2) and (9,2). Rewind at (5,4) and (12,4). Both ring on turns 14, 44 and 74. Cross on the next turn, then press and deliver. Return to the flags on turn 90.',
  ending: 'Six letters land on Eid’s desk. As the last bell falls quiet, Pip and Sprout come round the final corner and touch their flags together.',
  road, starts, fixed, solutionParts, programs: [blank, blank], solution: [north, north],
  inventory: {dial: solutionParts.length}, budget: solutionParts.length,
  handoffs: 0, relays: 0, quietBells: true,
});
