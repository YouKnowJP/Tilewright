import { CHANNEL_NUMBERS } from './adventure-accessibility.mjs';
import { createDocument, validateDocument, paintCells } from './model.mjs';
import { createRun, stepRun, walkableCells } from './adventure.mjs';
import { freshMemory } from './adventure-brain.mjs';
import { CHAPTERS } from './adventure-art.mjs';
import { GUILD_KITS } from './adventure-tools.mjs';

export const ADVENTURE_FORMAT = 'tilewright-adventure';
export const MAX_ADVENTURE_BYTES = 400_000, MAX_PROOF_ACTIONS = 2000, MAX_MARKERS = 128;
export const CHANNELS = Object.freeze(['amber', 'jade', 'violet', 'blue']);
export const OBJECTS = Object.freeze([
  ['start', 'Starting point', 'Goals'], ['beacon', 'Exit beacon', 'Goals'], ['lantern', 'Lantern', 'Goals'], ['coin', 'Treasure', 'Goals'],
  ['key', 'Brass key', 'Puzzles'], ['gate', 'Key gate', 'Puzzles'], ['crate', 'Pushable crate', 'Puzzles'], ['plate', 'Pressure plate', 'Puzzles'],
  ['bridge', 'Pressure bridge', 'Puzzles'], ['lever', 'Lever', 'Puzzles'], ['door', 'Lever door', 'Puzzles'], ['bell', 'Sequence bell', 'Puzzles'],
  ['signal', 'Signal gate', 'Puzzles'], ['waystone', 'Paired waystone', 'Puzzles'], ['guide', 'Talking keeper', 'Story'], ['rescue', 'Rescue keeper', 'Story'],
  ['relic', 'Singing relic', 'Story'], ['supplies', 'Supply cache', 'Story'], ['heart', 'Healing heart', 'Story'], ['fern', 'Fern cover', 'Threats'],
  ['ember', 'Cycling embers', 'Threats'], ['patrol', 'Patrol warden', 'Threats'], ['hunter', 'Adaptive hunter', 'Threats'], ['watcher', 'Watcher boss', 'Threats'],
].map(([id, name, group]) => ({ id, name, group })));
const kinds = new Set(OBJECTS.map(item => item.id)), overlays = new Set(['fern', 'ember']);
const text = (value, max, label, fallback = '') => {
  const result = value ?? fallback;
  if (typeof result !== 'string' || result.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(result)) throw Error(`${label} must be printable text, up to ${max} characters.`);
  return result.trim();
};
const lineText = (value, max, label, fallback = '') => { const result = text(value, max, label, fallback); if (/[\n\r\t]/.test(result)) throw Error(`${label} must fit on one line.`); return result; };
const integer = (value, min, max, label) => { if (!Number.isInteger(value) || value < min || value > max) throw Error(`${label} must be ${min}–${max}.`); return value; };
const point = (value, map) => ({ x: integer(value?.x, 0, map.width - 1, 'Column'), y: integer(value?.y, 0, map.height - 1, 'Row') });
export const nextMarkerId = markers => { let n = 1; while (markers.some(item => item.id === `mark-${n}`)) n++; return `mark-${n}`; };
export function normalizeAdventure(input) {
  if (!input || input.format !== ADVENTURE_FORMAT || input.version !== 1) throw Error('Choose a Tilewright adventure file (version 1), rather than a terrain-only map.');
  const map = validateDocument(input.map), title = lineText(input.title, 64, 'Adventure title');
  if (!title) throw Error('Give your adventure a title.');
  if (!Array.isArray(input.markers) || input.markers.length > MAX_MARKERS) throw Error(`Adventures support up to ${MAX_MARKERS} objects.`);
  const ids = new Set();
  const markers = input.markers.map(value => {
    if (!value || !kinds.has(value.kind) || !/^[a-z][a-z0-9-]{0,39}$/.test(value.id) || ids.has(value.id)) throw Error('Adventure objects need known types and unique simple IDs.');
    ids.add(value.id);
    const item = { id: value.id, kind: value.kind, ...point(value, map), name: lineText(value.name, 48, 'Object name'), text: text(value.text, 600, 'Keeper dialogue'),
      channel: CHANNELS.includes(value.channel) ? value.channel : 'amber', order: integer(value.order ?? 1, 1, 8, 'Bell order'),
      initial: value.initial === true, required: value.required === true, reward: ['advice', 'supplies', 'route'].includes(value.reward) ? value.reward : 'advice',
      nemesisOnly: value.nemesisOnly === true, vision: integer(value.vision ?? 6, 3, 10, 'Hunter vision'), offset: integer(value.offset ?? 0, 0, 3, 'Ember offset') };
    if (value.rival === 'listener' && ['hunter','watcher'].includes(item.kind)) item.rival = 'listener';
    if (['patrol', 'hunter', 'watcher'].includes(item.kind)) {
      if (!Array.isArray(value.route) || value.route.length > 24) throw Error('Threat routes support up to 24 waypoints.');
      item.route = value.route.map(p => point(p, map));
    }
    return item;
  });
  const pack = { format: ADVENTURE_FORMAT, version: 1, title, author: lineText(input.author, 48, 'Creator name', 'A trail keeper') || 'A trail keeper',
    description: text(input.description, 240, 'Description'), intro: text(input.intro, 800, 'Opening story'), ending: text(input.ending, 800, 'Ending'),
    hint: text(input.hint, 800, 'Hint'), source: text(input.source, 128, 'Remix credit'),
    theme: CHAPTERS.some(theme => theme.id === input.theme) ? input.theme : 'woodland',
    kit: GUILD_KITS.some(kit => kit.id === input.kit) ? input.kit : 'none', par: integer(input.par ?? 120, 8, 5000, 'Three-star target'),
    rules: { noDash: input.rules?.noDash === true, noShield: input.rules?.noShield === true, allCoins: input.rules?.allCoins === true }, map, markers };
  if (input.proof !== undefined) {
    const proof = input.proof;
    if (!proof || !['trail', 'nemesis'].includes(proof.difficulty) || !Array.isArray(proof.actions) || !proof.actions.length || proof.actions.length > MAX_PROOF_ACTIONS
      || proof.actions.some(action => typeof action !== 'string' || !/^(?:(?:dash-)?(?:up|right|down|left)|wait|decoy|shield|power|drop-cargo|close-dialogue|(?:interact|choose):[a-z][a-z0-9-]{0,39})$/.test(action))) throw Error('The creator clear contains an invalid or oversized action journal.');
    pack.proof = { difficulty: proof.difficulty, actions: [...proof.actions] };
  }
  return pack;
}
export function adventureKey(input) {
  const { proof, ...pack } = normalizeAdventure(input), source = JSON.stringify(pack);
  let a = 2166136261, b = 0x9e3779b9;
  for (let i = 0; i < source.length; i++) { a = Math.imul(a ^ source.charCodeAt(i), 16777619) >>> 0; b = Math.imul(b ^ source.charCodeAt(i), 2246822519) >>> 0; }
  return `player-${a.toString(16).padStart(8, '0')}${b.toString(16).padStart(8, '0')}`;
}
export function editAdventure(input, patch) { const { proof, ...pack } = input; return normalizeAdventure({ ...pack, ...patch }); }
export function placeObject(input, kind, x, y, extra = {}) {
  if (!kinds.has(kind)) throw Error('Choose a known adventure object.');
  const markers = input.markers.filter(item => !(item.kind === kind && ['start', 'beacon', 'relic'].includes(kind))
    && !(item.x === x && item.y === y && (overlays.has(kind) ? item.kind === kind : !overlays.has(item.kind))));
  const marker = { id: nextMarkerId(markers), kind, x, y, channel: 'amber', order: kind === 'bell' ? Math.min(8, markers.filter(item => item.kind === 'bell').length + 1) : 1, ...extra };
  if (['patrol', 'hunter', 'watcher'].includes(kind) && !marker.route) {
    const walkable = walkableCells(input.map), end = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([dx, dy]) => ({ x: x + dx, y: y + dy }))
      .find(p => p.x >= 0 && p.y >= 0 && p.x < input.map.width && p.y < input.map.height && walkable[p.y * input.map.width + p.x]);
    marker.route = [{ x, y }, ...(end ? [end] : [])];
  }
  return editAdventure(input, { markers: [...markers, marker] });
}
export function blankAdventure(width = 20, height = 14) {
  integer(width, 8, 64, 'Width'); integer(height, 8, 64, 'Height');
  const map = createDocument('A keeper’s world', width, height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x; map.layers[0].tiles[i] = (x * 7 + y * 13) % 9 < 2 ? 2 : 1;
    if (!x || !y || x === width - 1 || y === height - 1) map.layers[1].tiles[i] = 7;
  }
  return normalizeAdventure({ format: ADVENTURE_FORMAT, version: 1, title: 'A keeper’s world', author: 'A trail keeper', map,
    description: 'A new path, waiting for your story.', intro: 'Restore the lantern and return to the beacon. What will you discover on the way?', par: width * height,
    markers: [{ id: 'start', kind: 'start', x: 2, y: Math.floor(height / 2) }, { id: 'beacon', kind: 'beacon', x: width - 3, y: Math.floor(height / 2) }, { id: 'light', kind: 'lantern', x: Math.floor(width / 2), y: 2 }] });
}
export function adventureStage(input) {
  const pack = normalizeAdventure(input), by = kind => pack.markers.filter(item => item.kind === kind), position = marker => ({ id: marker.id, x: marker.x, y: marker.y });
  if (by('start').length !== 1 || by('beacon').length !== 1 || by('lantern').length < 1) throw Error('Place exactly one starting point, one beacon, and at least one lantern.');
  const switches = by('lever').map(item => ({ ...position(item), name: item.name || `${item.channel} lever`, initial: item.initial, description: item.text }));
  const leverFor = channel => by('lever').find(item => item.channel === channel);
  const relays = by('bell').sort((a, b) => a.order - b.order).map(item => ({ ...position(item), name: item.name || `Bell ${item.order}` }));
  const npcs = [...by('guide'), ...by('rescue')].map(item => {
    const npc = { ...position(item), name: item.name || (item.kind === 'rescue' ? 'Lost keeper' : 'Trail keeper'), lines: [item.text || 'The lanterns are waiting. Look for another way through.'], after: 'You came back for me. Let’s bring this story home.', choices: [] };
    if (item.reward === 'supplies') npc.choices = [
      { id: 'decoy', label: 'Pack an extra decoy', response: 'A false light for a difficult road. One decoy packed.', effect: { decoys: 1 } },
      { id: 'shield', label: 'Take a shield charge', response: 'Keep this for a dangerous crossing. One shield packed.', effect: { shields: 1 } },
    ];
    if (item.reward === 'route') {
      const lever = leverFor(item.channel); if (!lever) throw Error(`${npc.name} needs a lever on the ${item.channel} channel.`);
      npc.choices = [{ id: 'route', label: 'Ask for the secret route', response: 'The hidden crossing opens. A different way home awaits.', effect: { switches: { [lever.id]: true } } },
        { id: 'shield', label: 'Take supplies instead', response: 'A shield for the long road. You can still operate the lever yourself.', effect: { shields: 1 } }];
    }
    return npc;
  });
  const gates = pack.markers.filter(item => ['gate', 'bridge', 'door', 'signal'].includes(item.kind)).map(item => {
    const gate = { ...position(item), type: { gate: 'key', bridge: 'bridge', door: 'switch', signal: 'signal' }[item.kind], safeClose: true };
    if (item.kind === 'bridge') gate.plates = by('plate').filter(p => p.channel === item.channel).map(p => p.id);
    if (item.kind === 'door') {
      const lever = leverFor(item.channel); if (!lever) throw Error(`The ${item.channel} door needs a lever on its channel.`);
      gate.controls = [{ id: lever.id, on: true }]; gate.appearance = 'shutter';
    }
    return gate;
  });
  const hazards = by('ember').map(item => ({ ...position(item), period: 4, phases: [2, 3], offset: item.offset, ...(leverFor(item.channel) ? { disabledBy: leverFor(item.channel).id } : {}) }));
  const waystones = by('waystone').map(item => ({ ...position(item), name: item.name || `${item.channel} waystone`, partner: by('waystone').find(other => other.id !== item.id && other.channel === item.channel)?.id }));
  const cueChannels=Object.fromEntries(pack.markers.filter(item=>['plate','bridge','lever','door','waystone','ember'].includes(item.kind)).map(item=>[item.id,CHANNEL_NUMBERS[item.channel]||'1']));
  const stage = { cueChannels, id: adventureKey(pack), name: pack.title, subtitle: pack.description || `A player adventure by ${pack.author}`, theme: pack.theme, map: pack.map,
    start: position(by('start')[0]), exit: position(by('beacon')[0]), par: pack.par, intro: pack.intro || 'Restore every lantern, complete your quest, and reach the beacon.',
    hint: pack.hint || 'Read Quest for your goals. Plan reveals committed threats. Ask nearby keepers for advice.', ending: pack.ending,
    lanterns: by('lantern').map(position), keys: by('key').map(position), coins: by('coin').map(position), hearts: by('heart').map(position),
    crates: by('crate').map(position), plates: by('plate').map(position), gates, switches, relays, sequence: relays.map(item => item.id),
    requiredSwitches: by('lever').filter(item => item.required).map(item => item.id), requiredRescues: by('rescue').map(item => item.id), npcs,
    supplies: by('supplies').map(position), cover: by('fern').map(position), hazards, optionalPlates: true,
    enemies: by('patrol').map(item => ({ id: item.id, route: item.route })), hunters: [...by('hunter'), ...by('watcher')].map(item => ({ id: item.id, route: item.route, vision: item.vision, nemesisOnly: item.nemesisOnly, boss: item.kind === 'watcher', ...(item.rival ? {rival:item.rival,name:item.name || 'Vesper, the Listener'} : {}) })),
    restrictions: { noDash: pack.rules.noDash, noShield: pack.rules.noShield }, requireCoins: pack.rules.allCoins,
    relic: by('relic')[0] ? { ...position(by('relic')[0]), name: by('relic')[0].name || 'Singing relic' } : null,
    delivery: by('relic').length ? position(by('beacon')[0]) : null, workshop: { key: adventureKey(pack), author: pack.author, source: pack.source } };
  if (pack.kit !== 'none') { stage.guild = { kit: pack.kit, merits: ['clean', 'treasure', 'power'] }; stage.waystones = waystones; }
  else if (waystones.length) throw Error('Choose a specialist kit to use paired waystones.');
  return stage;
}
export function checkAdventure(input) {
  const errors = [], warnings = []; let pack, stage;
  try { pack = normalizeAdventure(input); } catch (error) { return { errors: [error.message], warnings, ready: false }; }
  const by = kind => pack.markers.filter(item => item.kind === kind);
  for (const kind of ['start', 'beacon', 'relic']) if (by(kind).length > 1) errors.push(`Keep only one ${kind}.`);
  for (const [kind, max] of [['lantern', 12], ['bell', 8], ['waystone', 8], ['patrol', 8], ['hunter', 6], ['watcher', 1], ['guide', 8], ['rescue', 8]]) if (by(kind).length > max) errors.push(`Use at most ${max} ${kind} objects.`);
  for (const channel of CHANNELS) {
    if (by('lever').filter(item => item.channel === channel).length > 1) errors.push(`Use one lever per channel (${channel}).`);
    const stones = by('waystone').filter(item => item.channel === channel).length;
    if (stones && stones !== 2) errors.push(`The ${channel} waystones need exactly two endpoints.`);
    if (by('bridge').some(item => item.channel === channel) && !by('plate').some(item => item.channel === channel)) errors.push(`The ${channel} bridge needs a pressure plate on its channel.`);
  }
  if (by('signal').length && !by('bell').length) errors.push('A signal gate needs at least one sequence bell.');
  const bells = by('bell').sort((a, b) => a.order - b.order);
  if (bells.some((bell, i) => bell.order !== i + 1)) errors.push('Number your bells once each, in order from 1.');
  const occupied = new Set(), walkable = walkableCells(pack.map);
  for (const marker of pack.markers) {
    const key = `${marker.x},${marker.y}`;
    if (!overlays.has(marker.kind)) { if (occupied.has(key)) errors.push(`Two objects overlap at column ${marker.x + 1}, row ${marker.y + 1}.`); occupied.add(key); }
    if (!['bridge', 'door', 'signal'].includes(marker.kind) && !walkable[marker.y * pack.map.width + marker.x]) errors.push(`${OBJECTS.find(item => item.id === marker.kind).name} at ${marker.x + 1},${marker.y + 1} needs walkable land.`);
    if (marker.route) {
      if (marker.route.length < 2 || marker.route[0].x !== marker.x || marker.route[0].y !== marker.y) errors.push('Threat routes must begin at their object and have at least two waypoints.');
      if (marker.route.some((p, i) => !walkable[p.y * pack.map.width + p.x] || (marker.kind === 'patrol' && i && Math.abs(p.x - marker.route[i - 1].x) + Math.abs(p.y - marker.route[i - 1].y) !== 1))) errors.push('Patrols need adjacent land cells; hunter waypoints need walkable land.');
    }
  }
  try { stage = adventureStage(pack); if (!errors.length) createRun(stage, { memory: freshMemory() }); } catch (error) { errors.push(error.message); }
  if (stage && !errors.length) {
    // An optimistic connectivity check catches isolated goals, not every puzzle deadlock.
    const gates = new Set(stage.gates.map(p => p.y * pack.map.width + p.x)), people = new Set(stage.npcs.map(p => p.y * pack.map.width + p.x));
    const queue = [stage.start], seen = new Set([stage.start.y * pack.map.width + stage.start.x]);
    for (let i = 0; i < queue.length; i++) for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const x = queue[i].x + dx, y = queue[i].y + dy, at = y * pack.map.width + x;
      if (x < 0 || y < 0 || x >= pack.map.width || y >= pack.map.height || seen.has(at) || people.has(at) || (!walkable[at] && !gates.has(at))) continue;
      seen.add(at); queue.push({ x, y });
    }
    const adjacent = p => [[0, -1], [1, 0], [0, 1], [-1, 0]].some(([dx, dy]) => p.x + dx >= 0 && p.x + dx < pack.map.width && p.y + dy >= 0 && p.y + dy < pack.map.height && seen.has((p.y + dy) * pack.map.width + p.x + dx));
    for (const marker of pack.markers.filter(p => ['beacon', 'lantern', 'key', 'coin', 'guide', 'rescue', 'relic', 'bell', 'lever'].includes(p.kind))) {
      if ((['guide', 'rescue', 'relic', 'bell', 'lever'].includes(marker.kind) ? !adjacent(marker) : !seen.has(marker.y * pack.map.width + marker.x)) && !by('waystone').length) errors.push(`${marker.name || marker.kind} is disconnected from the starting area.`);
    }
  }
  if (by('gate').length > by('key').length) warnings.push('There are more key gates than keys. Make sure a required route cannot consume the only key too early.');
  if (by('crate').length || by('plate').length || by('lever').length || by('waystone').length) warnings.push('Playtest both your outward and return paths. Linked puzzles can trap a route even when the map is connected.');
  if (!pack.proof) warnings.push('No creator clear yet. Finish a playtest to attach a replayable clear before sharing.');
  return { errors: [...new Set(errors)], warnings, ready: !errors.length, stage };
}
export async function verifyAdventureProof(input, yieldControl = null) {
  const pack = normalizeAdventure(input), report = checkAdventure(pack);
  if (!report.ready) throw Error(report.errors[0]);
  if (!pack.proof) return null;
  let run = createRun(report.stage, { difficulty: pack.proof.difficulty, memory: freshMemory() });
  for (let i = 0; i < pack.proof.actions.length; i++) {
    if (run.status !== 'playing') throw Error('The creator clear contains actions after its finish.');
    run = stepRun(run, pack.proof.actions[i]);
    if (yieldControl && i % 40 === 39) await yieldControl();
  }
  if (run.status !== 'won' || run.dialogue) throw Error('The attached creator clear does not finish this adventure. Ask for a fresh playtest or remove the old clear before editing.');
  return run;
}
export function applyStamp(input, stamp, x, y, channel = 'amber') {
  const radius = stamp === 'crossing' ? 3 : 2;
  if (x < radius || y < radius || x + radius >= input.map.width || y + radius >= input.map.height) throw Error(`Leave ${radius} tiles around this stamp.`);
  let map = input.map, markers = input.markers.filter(m => Math.abs(m.x - x) > radius || Math.abs(m.y - y) > radius), pack = editAdventure(input, { markers });
  const paint = (a, b, ground, detail) => { map = paintCells(map, map.layers[0].id, [{ x: a, y: b }], ground); for (const [index, layer] of map.layers.entries()) if (index) map = paintCells(map, layer.id, [{ x: a, y: b }], index === 1 ? detail : 0); };
  for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) paint(x + dx, y + dy, 1, stamp === 'grove' && Math.max(Math.abs(dx), Math.abs(dy)) === radius && !(dy === radius && dx === 0) ? 7 : 0);
  if (stamp === 'crossing') {
    for (let dy = -3; dy <= 3; dy++) paint(x + 1, y + dy, 3, 0);
    pack = editAdventure(pack, { map }); pack = placeObject(pack, 'crate', x - 2, y, { channel }); pack = placeObject(pack, 'plate', x - 1, y, { channel }); pack = placeObject(pack, 'bridge', x + 1, y, { channel });
  } else {
    pack = editAdventure(pack, { map }); pack = placeObject(pack, stamp === 'camp' ? 'supplies' : 'lantern', x, y);
    pack = placeObject(pack, stamp === 'camp' ? 'guide' : 'coin', x - 1, y, { reward: 'supplies', text: 'Take what you need for the next crossing.' });
  }
  return pack;
}
