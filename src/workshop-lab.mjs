import { blankAdventure, editAdventure, normalizeAdventure, adventureStage } from './workshop-model.mjs';
import { createRun, canEnter } from './adventure.mjs';
import { LAB_CLEARS } from './workshop-lab-clears.mjs';

export const LAB_ROOMS = Object.freeze([
  { id: 'counterweight', title: 'Counterweight Creek', theme: 'marsh', lesson: 'Crates & pressure bridges', idea: 'Make a second crossing that can be held open by a lantern double instead of a crate.' },
  { id: 'brassloop', title: 'The Two-Key Detour', theme: 'archive', lesson: 'Keys & return routes', idea: 'Hide a second route home. Keep enough keys for every required gate.' },
  { id: 'bellgarden', title: 'Three Bells at Dusk', theme: 'clockwork', lesson: 'Sequences & treasure', idea: 'Move the bells so the sequence asks the player to discover a new route.' },
  { id: 'footstep', title: 'The Borrowed Footstep', theme: 'aurora', lesson: 'Lantern doubles & alternate solutions', idea: 'Solve this with a double, then try the crate. Build another puzzle with two different answers.' },
  { id: 'tidekeeper', title: 'Parcel for the Tidekeeper', theme: 'coast', lesson: 'Dialogue, rescue & delivery', idea: 'Give the keeper a meaningful route-or-supplies choice, then write two hints for the journey home.' },
  { id: 'emberclock', title: 'The Emberclock Orchard', theme: 'dunes', lesson: 'Linked levers & cooled embers', idea: 'Change one channel and study which doors and embers respond. Keep the return route open.' },
]);

export function puzzleLabWorld(id) {
  const room = LAB_ROOMS.find(item => item.id === id); if (!room) throw Error('Choose a known puzzle room.');
  const base = blankAdventure(12, 10), map = base.map;
  map.layers[0].tiles.fill(1);
  for (let y = 1; y < 9; y++) map.layers[0].tiles[y * 12 + 6] = 3;
  map.layers[0].tiles[5 * 12 + 6] = 12;
  let markers = [{ id: 'start', kind: 'start', x: 2, y: 5 }, { id: 'home', kind: 'beacon', x: 2, y: 7 }, { id: 'light', kind: 'lantern', x: 8, y: 3 }];
  const add = (kind, id, x, y, extra = {}) => markers.push({ kind, id, x, y, ...extra });
  let kit = 'none', rules = {}, intro = '', hint = '';
  if (id === 'counterweight') {
    add('crate', 'counterweight', 3, 5); add('plate', 'copper', 4, 5); add('bridge', 'crossing', 6, 5);
    intro = 'One push will wake the copper crossing. Find a way around your own counterweight, and leave it where it can help you home.';
    hint = 'Push the crate east onto its plate, then walk around it using the northern bank.';
  } else if (id === 'brassloop') {
    add('key', 'west-key', 3, 3); add('gate', 'river-lock', 6, 5); add('key', 'east-key', 9, 6); add('gate', 'vault-lock', 8, 4);
    for (const [x, y] of [[7, 3], [9, 3], [8, 2]]) map.layers[1].tiles[y * 12 + x] = 7;
    intro = 'The river key is only the beginning. A second key waits beyond the crossing, and the lantern vault has its own lock.';
    hint = 'Find the western key first. The eastern key waits south of the vault; approach the second lock from below.';
  } else if (id === 'bellgarden') {
    add('bell', 'dew', 3, 2, { name: 'Dew', order: 1 }); add('bell', 'dusk', 3, 7, { name: 'Dusk', order: 2 }); add('bell', 'moon', 5, 3, { name: 'Moon', order: 3 }); add('signal', 'song-gate', 6, 5);
    for (const [i, x, y] of [[1, 8, 6], [2, 9, 4], [3, 9, 7]]) add('coin', `token-${i}`, x, y);
    rules = { allCoins: true }; intro = 'Ring Dew, Dusk, then Moon. The far garden keeps three little tokens; bring every one home with its light.';
    hint = 'The three bells are all on the western bank. The signal gate opens only after the complete sequence.';
  } else if (id === 'footstep') {
    kit = 'echoist'; markers = markers.filter(item => item.kind !== 'beacon' && item.kind !== 'lantern');
    add('beacon', 'home', 8, 7); add('lantern', 'light', 8, 5); add('plate', 'copper', 4, 5); add('bridge', 'crossing', 6, 5); add('crate', 'counterweight', 4, 3);
    intro = 'A lantern double can hold a plate for six turns. A crate can hold it for as long as you need. Which answer will you take across the water?';
    hint = 'Stand on the copper plate and use B, then walk straight east. Or push the northern crate south onto the plate.';
  } else if (id === 'tidekeeper') {
    markers = markers.filter(item => item.kind !== 'lantern'); add('lantern', 'light', 8, 2);
    add('lever', 'ferry', 4, 4, { name: 'Ferry lever', required: true }); add('door', 'ferry-door', 6, 5);
    add('guide', 'postkeeper', 3, 3, { name: 'Postkeeper Vale', reward: 'route', text: 'A parcel for the tidekeeper? I can open the crossing, or pack a shield if you would rather find its lever yourself.' });
    add('rescue', 'tidekeeper', 9, 6, { name: 'Kelp', text: 'Restore the island light, then come back for me. Bring our singing parcel to the home beacon too.' });
    add('relic', 'parcel', 8, 3, { name: 'Singing parcel' });
    intro = 'Vale offers a choice at the river. Beyond it, a keeper and a singing parcel are waiting for the same way home.';
    hint = 'Vale can open the ferry, or you can turn its lever. Restore the lantern, take the parcel, rescue Kelp, and return to the beacon.';
  } else {
    markers = markers.filter(item => item.kind !== 'lantern'); add('lantern', 'light', 9, 2);
    add('lever', 'river', 4, 3, { name: 'River wheel', required: true }); add('door', 'river-door', 6, 5);
    add('lever', 'orchard', 8, 6, { name: 'Orchard wheel', channel: 'jade', required: true }); add('door', 'orchard-door', 8, 3, { channel: 'jade' });
    for (const x of [7, 9, 10]) map.layers[1].tiles[3 * 12 + x] = 7;
    add('ember', 'bank-embers', 5, 5); add('ember', 'orchard-embers', 8, 4, { channel: 'jade' });
    for (const [i, x, y] of [[1, 3, 2], [2, 9, 6], [3, 7, 2]]) add('coin', `token-${i}`, x, y);
    rules = { allCoins: true, noDash: true }; intro = 'Two wheels, two channels. Cool the crossing, wake the orchard door, and collect the scattered brass fruit before you bring the light home.';
    hint = 'Amber turns the river door and its embers off together. Jade controls the orchard. Both wheels must remain on when you leave.';
  }
  const pack = editAdventure(base, { title: room.title, author: 'Lantern Trails', description: room.lesson, theme: room.theme, map, markers, kit, rules,
    intro, hint, ending: 'Another idea has taken root. Remix this room and let someone discover your answer.', source: 'Puzzle Lab original', par: 140 });
  return normalizeAdventure({ ...pack, ...(LAB_CLEARS[id] ? { proof: { difficulty: 'trail', actions: LAB_CLEARS[id] } } : {}) });
}

export function transformAdventure(input, operation) {
  const pack = normalizeAdventure(input), { width, height } = pack.map;
  if (!['rotate', 'mirror-x', 'mirror-y'].includes(operation)) throw Error('Choose rotate, mirror east/west, or mirror north/south.');
  const point = ({ x, y }) => operation === 'rotate' ? { x: height - 1 - y, y: x } : operation === 'mirror-x' ? { x: width - 1 - x, y } : { x, y: height - 1 - y };
  const nextWidth = operation === 'rotate' ? height : width, nextHeight = operation === 'rotate' ? width : height;
  const map = { ...pack.map, width: nextWidth, height: nextHeight, layers: pack.map.layers.map(layer => {
    const tiles = Array(nextWidth * nextHeight).fill(0);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) { const p = point({ x, y }); tiles[p.y * nextWidth + p.x] = layer.tiles[y * width + x]; }
    return { ...layer, tiles };
  }) };
  return editAdventure(pack, { map, markers: pack.markers.map(marker => ({ ...marker, ...point(marker), ...(marker.route ? { route: marker.route.map(point) } : {}) })) });
}

export function cursorPractice(input, point) {
  const stage = adventureStage(input), run = createRun(stage);
  if (!point || !Number.isInteger(point.x) || !Number.isInteger(point.y) || !canEnter(run, point) || run.crates.some(crate => crate.x === point.x && crate.y === point.y)) throw Error('Put the cursor on open, walkable land, away from keepers, crates, and closed gates.');
  return { ...stage, start: { x: point.x, y: point.y }, intro: `Practice from column ${point.x + 1}, row ${point.y + 1}. Goals and supplies start fresh. This attempt cannot record bests or a creator clear. ${stage.intro}`, workshop: { ...stage.workshop, practice: true } };
}

const SPARK_GOALS = ['a keeper who knows a shortcut', 'a relic that must come home', 'a treasure circuit with a different way back', 'a bell sequence heard across a river', 'a bridge with two different solutions', 'a lantern hidden behind two linked doors'];
const SPARK_TWISTS = ['Make the safe route longer than the daring route.', 'Let a conversation change the return journey.', 'Give an Echoist double something useful to hold.', 'Use one lever to change two parts of the world.', 'Leave a hint in a keeper’s story, without giving away the whole answer.', 'Make a quiet route that rewards observation instead of speed.'];
export function designSpark(seed) {
  if (typeof seed !== 'string' || seed.length > 64) throw Error('Use a spark seed of up to 64 characters.');
  let hash = 2166136261; for (const character of seed) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0;
  return { title: `Build ${SPARK_GOALS[hash % SPARK_GOALS.length]}.`, twist: SPARK_TWISTS[Math.floor(hash / SPARK_GOALS.length) % SPARK_TWISTS.length], goal: 'Playtest the outward and return routes. Then let a friend try a different answer.' };
}
