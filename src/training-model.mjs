import { blankAdventure, editAdventure, normalizeAdventure, placeObject } from './workshop-model.mjs';
import { paintCells } from './model.mjs';

export const TRAINING_KEY = 'tilewright.training.v1';
export const PRACTICE_SPOTS = Object.freeze({ bridge: { x: 5, y: 4 }, lantern: { x: 7, y: 3 }, guide: { x: 3, y: 3 } });
export const PRACTICE_STORY = 'A little island, waiting for your story.';
export const PRACTICE_DIALOGUE = 'Write a welcome or a useful hint for your traveller.';

export function practiceWorld(lesson = 'play') {
  const pack = blankAdventure(10, 8);
  for (let y = 1; y < 7; y++) pack.map.layers[0].tiles[y * 10 + 5] = 3;
  pack.markers = [{ id: 'start', kind: 'start', x: 2, y: 4 }, { id: 'home', kind: 'beacon', x: 2, y: 6 }];
  if (lesson === 'create') return editAdventure(pack, { title: 'My first island', intro: PRACTICE_STORY, description: 'Made at the Wayfarer’s training camp.', par: 70 });
  pack.map.layers[0].tiles[45] = 12;
  return editAdventure(pack, {
    title: 'First Light Crossing', par: 70, intro: 'Mira is waiting by the river. Ask her about the crossing, bring back its light, then lead her home.',
    ending: 'A crossing restored. A keeper brought home. Your first real adventure is complete.',
    markers: [...pack.markers,
      { id: 'mira', kind: 'rescue', x: 2, y: 2, name: 'Mira', text: 'Welcome, wayfarer. Walk beside a keeper and use Interact to talk. The brass lever opens the river door. Restore the lantern across the water, then come back and speak to me again. I’ll follow you to the turquoise beacon.' },
      { id: 'crossing', kind: 'lever', x: 4, y: 3, name: 'Crossing lever', required: true },
      { id: 'river-door', kind: 'door', x: 5, y: 4 },
      { id: 'first-light', kind: 'lantern', x: 7, y: 3 },
      { id: 'pocket-coin', kind: 'coin', x: 7, y: 5 }],
  });
}

export function paintPractice(pack, brush, point) {
  const spot = PRACTICE_SPOTS[brush];
  if (!spot || point.x !== spot.x || point.y !== spot.y) throw Error('Use the marked practice spot for this brush. The full Workshop lets you build anywhere.');
  if (brush === 'bridge') return editAdventure(pack, { map: paintCells(pack.map, pack.map.layers[0].id, [spot], 12) });
  return placeObject(pack, brush, spot.x, spot.y, { id: `practice-${brush}`, ...(brush === 'guide' ? { name: 'Your keeper', text: PRACTICE_DIALOGUE } : {}) });
}

export function tellPracticeStory(pack, { title, intro, dialogue }) {
  return editAdventure(pack, { title, intro, markers: pack.markers.map(marker => marker.kind === 'guide' ? { ...marker, text: dialogue } : marker) });
}

export function playLessonSteps(run) {
  return [
    { done: run.turns > 0, title: 'Take your first steps', text: 'Walk north toward Mira. Use the arrow keys, WASD, the direction pad, or swipe the map.', hint: 'You begin at column 3, row 5. One step north puts you beside Mira.', target: { x: 2, y: 3 } },
    { done: run.talkedTo.includes('mira'), title: 'Meet a keeper', text: 'Stand beside Mira and choose Interact, or press E. Conversations pause the world. Close her message when you are ready.', hint: 'Mira waits at column 3, row 3. Stand one tile away and use Interact.', target: { x: 2, y: 2 } },
    { done: run.switches.crossing === true, title: 'Open the river crossing', text: 'Walk beside the brass lever, then Interact. Its amber door opens across the river. Plan explains the map without spending a turn.', hint: 'From Mira, walk east to column 5, row 4. Interact with Crossing lever.', target: { x: 4, y: 3 } },
    { done: run.collectedLanterns.includes('first-light'), title: 'Bring back the light', text: 'Cross the open river door and walk onto the golden lantern. Treasure is optional. Blocked steps cost no turns.', hint: 'Cross at column 6, row 5, then find the lantern at column 8, row 4.', target: { x: 7, y: 3 } },
    { done: run.rescued.includes('mira'), title: 'Go back for Mira', text: 'Return to Mira and Interact again. With the light restored, she can follow you home.', hint: 'Cross back over the same bridge. Stand beside Mira at column 3, row 3.', target: { x: 2, y: 2 } },
    { done: run.status === 'won', title: 'Follow the beacon home', text: 'Lead Mira to the turquoise beacon. Every adventure asks you to finish its goals before leaving.', hint: 'The beacon waits at column 3, row 7. Walk onto it with Mira following.', target: { x: 2, y: 6 } },
  ];
}

export function creatorLessonSteps(pack, { checked = false, won = false, shared = false } = {}) {
  const guide = pack.markers.find(marker => marker.kind === 'guide');
  return [
    { done: pack.map.layers[0].tiles[45] === 12, title: 'Make a crossing', text: 'Choose Bridge, then paint the bright square in the river. A world needs a route out and a route back.', hint: 'Paint column 6, row 5. Arrow keys move the cursor; Space paints. You can also click or tap.', target: PRACTICE_SPOTS.bridge },
    { done: pack.markers.some(marker => marker.kind === 'lantern'), title: 'Give the player a goal', text: 'Choose Lantern and place it on the marked island square. Players must restore every lantern before the beacon lets them leave.', hint: 'Choose Lantern, then paint column 8, row 4.', target: PRACTICE_SPOTS.lantern },
    { done: Boolean(guide), title: 'Give your world a voice', text: 'Choose Keeper and place a friendly guide on the marked square. Players can stand beside them and Interact.', hint: 'Choose Keeper, then paint column 4, row 4.', target: PRACTICE_SPOTS.guide },
    { done: pack.title !== 'My first island' && pack.intro !== PRACTICE_STORY && Boolean(pack.intro) && Boolean(guide?.text) && guide.text !== PRACTICE_DIALOGUE,
      title: 'Tell a little story', text: 'Open Your story. Give the world a title, write its opening, and let the keeper share a useful hint. Choose Save story.', hint: 'Use a short title, one sentence to invite the player in, and a keeper’s hint about the bridge.' },
    { done: checked, title: 'Check the outward and return route', text: 'Choose Check world. It checks real world data for missing goals and disconnected routes. A real playtest comes next.', hint: 'The bridge, lantern, and keeper should all be in place. Check world reports anything still missing.' },
    { done: won, title: 'Walk the world you made', text: 'Choose Playtest. Restore your lantern and reach the beacon. You can talk to your keeper on the way. A real finish records your creator clear.', hint: 'Cross your bridge at column 6, row 5, restore the light, then return to the turquoise beacon.' },
    { done: shared, title: 'Keep your first adventure', text: 'Download your adventure, copy its public play link, or take it to the full Workshop. Friends can play the file through Import & play.', hint: 'Download my world keeps a portable backup. Keep building opens a copy in the full Workshop after checking your current draft.' },
  ];
}

export function readTraining(storage) {
  try {
    const raw = storage.getItem(TRAINING_KEY);
    if (!raw || raw.length > 1000) return { play: false, create: false };
    const data = JSON.parse(raw);
    return data.version === 1 ? { play: data.play === true, create: data.create === true } : { play: false, create: false };
  } catch { return { play: false, create: false }; }
}
export function saveTraining(storage, progress) {
  try { storage.setItem(TRAINING_KEY, JSON.stringify({ version: 1, play: progress.play === true, create: progress.create === true })); return true; }
  catch { return false; }
}

export function practiceClear(pack, actions) {
  const { proof, ...world } = pack;
  return normalizeAdventure({ ...world, ...(actions.length <= 2000 ? { proof: { difficulty: 'trail', actions: [...actions] } } : {}) });
}
