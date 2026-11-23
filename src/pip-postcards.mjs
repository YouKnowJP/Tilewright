// New owned material. See LICENSE; prior MIT permissions remain effective.
const point = (x, y) => ({x, y});
const row = (y, first, last) => Array.from({length: last - first + 1}, (_, i) => point(first + i, y));
const part = (kind, x, y, options = {}) => ({kind, x, y, ...options});
const amber = {channel: 'amber'};
const jade = {channel: 'jade'};
const east = ['right', 'right', 'use'];
const wait = ['wait', 'wait', 'wait'];

function postcard(definition) {
  return Object.freeze({
    collection: 'postcards', width: 7, height: 5, minutes: '2–5 min',
    difficulty: 'Gentle', budget: 0, inventory: {}, handoffs: 0,
    ...definition
  });
}

export const PIP_POSTCARDS = Object.freeze([
  postcard({
    id: 'postcard-before-dawn', title: 'One Letter Before Dawn',
    road: [...row(3, 1, 6), ...row(1, 2, 3)],
    starts: [point(1, 3), point(2, 1)],
    fixed: [
      part('source', 1, 3, amber), part('bridge', 3, 3, jade),
      part('receiver', 5, 3, amber), part('pip-dock', 6, 3),
      part('sprout-dock', 2, 1), part('plate', 3, 1, jade)
    ],
    programs: [['use', 'right', 'right'], ['wait', 'wait', 'left']],
    solution: [['use', 'right', 'right'], ['wait', 'right', 'left']],
    stampTicks: 9,
    story: 'Sprout holds a plate while Pip carries a letter across the bridge. Deliver it, then bring both friends to their flags.',
    guide: {
      cards: 'Pip’s cards are ready. Change one of Sprout’s Wait cards to reach Plate 2 before Pip needs the bridge.',
      tracker: 'bridges',
      repeat: 'The route repeats. Check when Sprout holds Plate 2 and when both couriers reach their flags.'
    },
    clues: ['Sprout starts on the S flag, one step west of Plate 2.', 'Pip reaches the bridge on tick 3. Sprout can step off the plate on that same tick.'],
    hint: 'Pip: Use / East / East. Sprout: Wait / East / West. Pip delivers on tick 7 and reaches the flag on tick 8. Sprout comes home on tick 9.',
    ending: 'The letter is waiting when the first light reaches the window.'
  }),
  postcard({
    id: 'postcard-dash-of-jade', title: 'A Dash of Jade',
    road: [...row(3, 1, 5), point(5, 2)],
    starts: [point(1, 3), point(5, 2)],
    fixed: [
      part('source', 1, 3, amber), part('press', 3, 3, {...amber, output: 'jade'}),
      part('handoff', 5, 3), part('receiver', 5, 2, jade)
    ],
    programs: [east, ['wait', 'wait', 'use']],
    solution: [['use', 'right', 'right'], ['wait', 'wait', 'use']],
    handoffs: 1,
    stampTicks: 9,
    story: 'Turn amber into jade at the dye press, then pass the invitation to Sprout at the window.',
    guide: {
      cards: 'Pip starts right on the well. Which card lets Pip collect the amber parcel before walking away?',
      repeat: 'The route repeats. Check whether Pip collects amber, dyes it jade, then passes it beside Sprout.'
    },
    clues: ['Pip needs a parcel before the press can dye it.', 'Start with Use at the well. Two steps east put Pip on the press when Use comes around again.'],
    hint: 'Pip: Use / East / East. Sprout: Wait / Wait / Use. Pip passes the jade invitation on tick 7, and Sprout delivers on tick 9.',
    ending: 'Sprout slips a jade invitation into the window with a wave.'
  }),
  postcard({
    id: 'postcard-brass-shortcut', title: 'The Brass Shortcut',
    width: 9,
    road: [...row(3, 1, 5), ...row(1, 1, 5), point(7, 3), point(7, 4)],
    starts: [point(1, 3), point(7, 3)],
    fixed: [
      part('source', 3, 3, amber), part('tube', 5, 3, {channel: 'blue'}),
      part('tube', 1, 1, {channel: 'blue'}), part('receiver', 3, 1, amber),
      part('pip-dock', 5, 1), part('sprout-dock', 7, 4)
    ],
    programs: [east, wait],
    solution: [east, ['down', 'wait', 'wait']],
    stampTicks: 11,
    story: 'Take the blue tube to the far window. After the delivery, finish with both couriers at their flags.',
    guide: {
      cards: 'Use activates the tube and keeps the rest of Pip’s loop. Give Sprout a short walk to the S flag.',
      repeat: 'The route repeats. After delivering, check whether both couriers reach their home flags.'
    },
    clues: ['The blue tubes are one road with a gap in the middle.', 'Follow Pip’s preset cards through the tube. Sprout’s home flag is one step south.'],
    hint: 'Pip: East / East / Use. Sprout: South / Wait / Wait. Pip delivers on tick 9 and reaches the flag on tick 11.',
    ending: 'A quiet thump from the tube, then a letter from across the water.'
  })
]);

export const postcardById = id => PIP_POSTCARDS.find(puzzle => puzzle.id === id);

// Monday UTC gives every device the same rotation, including during clock changes.
const FIRST_WEEK = Date.UTC(2026, 10, 23);
const WEEK = 7 * 24 * 60 * 60 * 1000;
export function featuredPostcard(now = Date.now()) {
  const week = Math.max(0, Math.floor((now - FIRST_WEEK) / WEEK));
  return PIP_POSTCARDS[week % PIP_POSTCARDS.length];
}

export function postcardProgress(puzzle, journal) {
  const clears = journal.bests[puzzle.id] || [];
  const best = clears.length ? Math.min(...clears.map(project => project.proof.ticks)) : null;
  return {
    best,
    stamped: best !== null && best <= puzzle.stampTicks,
    saved: Boolean(journal.drafts[puzzle.id])
  };
}
