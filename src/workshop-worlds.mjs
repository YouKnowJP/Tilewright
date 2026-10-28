import { createDocument } from './model.mjs';
import { generateStage, routePreview, normalizeSeed, BIOMES, FAMILIES } from './adventure-generator.mjs';
import { createCustomStage, walkableCells } from './adventure.mjs';
import { ADVENTURE_FORMAT, normalizeAdventure, nextMarkerId } from './workshop-model.mjs';

export const WORLD_REGIONS = BIOMES;
export const WORLD_MISSIONS = FAMILIES.slice(0, 5);
export function adventureFromStage(stage, metadata = {}) {
  const markers = [], used = new Set(), walkable = walkableCells(stage.map);
  const add = (kind, value, extra = {}) => {
    let id = extra.id || value.id || nextMarkerId(markers); if (markers.some(item => item.id === id)) id = nextMarkerId(markers);
    let p = { x: value.x, y: value.y };
    if (!['fern', 'ember'].includes(kind) && used.has(`${p.x},${p.y}`)) {
      p = [[1, 0], [0, 1], [-1, 0], [0, -1], [-1, -1], [1, 1]].map(([dx, dy]) => ({ x: value.x + dx, y: value.y + dy }))
        .find(q => q.x >= 0 && q.y >= 0 && q.x < stage.map.width && q.y < stage.map.height && walkable[q.y * stage.map.width + q.x] && !used.has(`${q.x},${q.y}`));
      if (!p) throw Error('This template needs more room for its objectives. Try another seed.');
    }
    if (!['fern', 'ember'].includes(kind)) used.add(`${p.x},${p.y}`);
    markers.push({ kind, name: value.name || '', ...extra, id, ...p, ...(extra.route ? { route: [p, ...extra.route.slice(1)] } : {}) });
  };
  add('start', stage.start); add('beacon', stage.exit);
  for (const [kind, field] of [['lantern', 'lanterns'], ['key', 'keys'], ['coin', 'coins'], ['heart', 'hearts'], ['supplies', 'supplies'], ['fern', 'cover'], ['ember', 'hazards']])
    for (const value of stage[field] || []) add(kind, value, kind === 'ember' ? { offset: value.offset || 0 } : {});
  for (const value of stage.gates || []) add(value.type === 'signal' ? 'signal' : 'gate', value);
  for (const value of stage.relays || []) add('bell', value, { order: stage.sequence.indexOf(value.id) + 1 });
  for (const value of stage.npcs || []) add(stage.requiredRescues?.includes(value.id) ? 'rescue' : 'guide', value, { text: value.lines.join('\n\n'), reward: value.choices?.length ? 'supplies' : 'advice' });
  if (stage.relic) add('relic', stage.relic);
  for (const value of stage.enemies || []) add('patrol', value.route[0], { id: value.id, route: value.route });
  for (const value of stage.hunters || []) add(value.boss ? 'watcher' : 'hunter', value.route[0], { id: value.id, route: value.route, vision: value.vision || 6, nemesisOnly: value.nemesisOnly || false });
  return normalizeAdventure({ format: ADVENTURE_FORMAT, version: 1, title: stage.name, author: 'A trail keeper', description: stage.subtitle || 'A new adventure in your own world.',
    map: stage.map, markers, theme: stage.theme || 'woodland', par: stage.par, intro: stage.intro, hint: stage.hint,
    rules: { noDash: stage.restrictions?.noDash, noShield: stage.restrictions?.noShield, allCoins: stage.requireCoins }, ...metadata });
}
export function adventureFromMap(map) { return adventureFromStage(createCustomStage(map), { title: map.name, description: 'Your painted world, ready for a story.' }); }
export function seededAdventure(seed, region = 'woodland', family = 'lantern', bold = false) {
  if (!WORLD_REGIONS.some(item => item.id === region) || !WORLD_MISSIONS.some(item => item.id === family)) throw Error('Choose a known region and mission.');
  const base = normalizeSeed(seed).slice(0, 22); let config, preview;
  for (let n = 0; n < 512; n++) {
    config = { mode: 'contract', seed: `${base}-${n}`, length: 1, difficulty: 'trail', vow: 'none' };
    preview = routePreview(config, 0, bold ? 'b' : 's'); if (preview.biome.id === region && preview.family.id === family) break;
  }
  if (preview.biome.id !== region || preview.family.id !== family) throw Error('Could not match that world recipe. Try another seed.');
  const stage = generateStage(config, 0, bold ? 'b' : 's');
  return adventureFromStage(stage, { theme: { woodland: 'woodland', marsh: 'marsh', ruins: 'archive', dunes: 'dunes' }[region], source: `World seed: ${config.seed} · ${bold ? 'perilous' : 'sheltered'}` });
}
function world(title, theme, kit) {
  const map = createDocument(title, 20, 14);
  for (let y = 0; y < 14; y++) for (let x = 0; x < 20; x++) {
    const i = y * 20 + x; map.layers[0].tiles[i] = theme === 'coast' ? (x + y) % 5 ? 4 : 2 : (x * 7 + y * 11) % 7 ? 1 : 2;
    if (!x || !y || x === 19 || y === 13) map.layers[1].tiles[i] = theme === 'archive' ? 9 : 7;
  }
  return { format: ADVENTURE_FORMAT, version: 1, title, author: 'Tilewright', description: '', map, markers: [], theme, kit, par: 160, rules: {}, intro: '', hint: '', ending: '' };
}
function object(pack, kind, id, x, y, extra = {}) { pack.markers.push({ id, kind, x, y, ...extra }); }
function wall(pack, x, holes) { for (let y = 1; y < 13; y++) if (!holes.includes(y)) pack.map.layers[1].tiles[y * 20 + x] = 9; }
export function workshopShowcases() {
  const post = world('The Brassleaf Post', 'coast', 'mistweaver'); wall(post, 10, [7]);
  post.description = 'A postcard, a missing keeper, and a tide door with two ways to open it.';
  post.intro = 'The last postcard is still singing beyond the tide door. Bring back both lanterns, find Ivo, and carry the postcard home.';
  post.hint = 'Luma can open the amber tide door, or lend you supplies. The amber lever opens the same door and cools its embers. Ivo will follow after both lights are restored.';
  post.ending = 'Ivo reads the postcard aloud. Somewhere beyond the sea, a forgotten house lights its windows.';
  for (const [kind, id, x, y] of [['start', 'start', 2, 7], ['beacon', 'home', 3, 9], ['lantern', 'west-light', 7, 3], ['lantern', 'east-light', 16, 10], ['relic', 'postcard', 16, 4], ['supplies', 'cache', 14, 7], ['heart', 'heart', 17, 4]]) object(post, kind, id, x, y);
  object(post, 'guide', 'luma', 3, 7, { name: 'Luma', channel: 'amber', reward: 'route', text: 'I can turn the tide door from here, or give you a shield for the long road. You can also use the amber lever yourself. Which story will you take?' });
  object(post, 'rescue', 'ivo', 16, 6, { name: 'Ivo', text: 'I stayed to watch the postcard. Restore both lanterns, then come back for me.' });
  object(post, 'lever', 'tide-wheel', 6, 7, { name: 'Tide wheel', channel: 'amber' }); object(post, 'door', 'tide-door', 10, 7, { channel: 'amber' });
  for (const x of [12, 13]) object(post, 'ember', `ember-${x}`, x, 7, { channel: 'amber' });
  object(post, 'patrol', 'post-warden', 17, 8, { route: [{ x: 17, y: 8 }, { x: 17, y: 9 }, { x: 17, y: 10 }] });
  for (const [i, x, y] of [[0, 4, 4], [1, 14, 3], [2, 17, 11]]) object(post, 'coin', `coin-${i}`, x, y);

  const bridge = world('The Borrowed Moon', 'archive', 'echoist');
  bridge.description = 'Crates, doubles, and paired stones offer different roads across a moonlit river.';
  bridge.intro = 'The moon’s last three coins have fallen into the archive. Recover them, light both lamps, and ring Moon then Tide before reaching the beacon.';
  bridge.hint = 'Push the crate right onto its jade plate, leave a double on the plate, or use the blue waystones. Ring Moon before Tide. Every coin is needed.';
  bridge.ending = 'The borrowed moon rises from the archive. You leave a little silver on every road.'; bridge.rules.allCoins = true;
  for (let y = 1; y < 13; y++) bridge.map.layers[0].tiles[y * 20 + 9] = 3;
  for (const [kind, id, x, y] of [['start', 'start', 2, 7], ['beacon', 'home', 17, 10], ['lantern', 'west-light', 6, 3], ['lantern', 'east-light', 16, 3], ['crate', 'crate', 4, 7], ['coin', 'coin-west', 7, 10], ['coin', 'coin-north', 12, 3], ['coin', 'coin-east', 17, 5]]) object(bridge, kind, id, x, y);
  object(bridge, 'plate', 'jade-plate', 5, 7, { channel: 'jade' }); object(bridge, 'bridge', 'jade-bridge', 9, 7, { channel: 'jade' });
  object(bridge, 'waystone', 'stone-west', 6, 9, { name: 'West archive', channel: 'blue' }); object(bridge, 'waystone', 'stone-east', 12, 9, { name: 'East archive', channel: 'blue' });
  object(bridge, 'bell', 'moon', 12, 5, { order: 1, name: 'Moon' }); object(bridge, 'bell', 'tide', 16, 8, { order: 2, name: 'Tide' }); object(bridge, 'signal', 'signal-door', 16, 9);
  object(bridge, 'guide', 'ari', 3, 9, { name: 'Ari', reward: 'supplies', text: 'A crate lasts. A double buys six turns. A waystone takes one energy. Which crossing will you make your own?' });

  const courier = world('Hearthlight Express', 'clockwork', 'bellrunner'); wall(courier, 10, [3, 7]);
  courier.description = 'A courier route with a listening hunter, two garden doors, and a keeper to bring home.';
  courier.intro = 'The night train has left its heart in the brassleaf garden. Restore three lights, rescue Neri, and deliver the singing heart to the western beacon.';
  courier.hint = 'The amber lever opens the lower door and cools its embers. The jade lever opens a second route. Pulse stops nearby hunters for two turns; walking and decoys can change their lead.';
  courier.ending = 'The station clock wakes. Neri hangs a lantern on the last carriage, and the Hearthlight Express leaves for morning.';
  for (const [kind, id, x, y] of [['start', 'start', 2, 7], ['beacon', 'home', 2, 10], ['lantern', 'west-light', 5, 3], ['lantern', 'north-light', 15, 3], ['lantern', 'south-light', 16, 10], ['relic', 'heart-song', 17, 10], ['supplies', 'cache', 14, 10], ['heart', 'heart', 12, 7]]) object(courier, kind, id, x, y);
  object(courier, 'guide', 'pip', 3, 7, { name: 'Pip', reward: 'supplies', text: 'A listening hunter patrols the eastern garden. Choose a decoy or shield. Its next step is always shown. A pulse buys time; a dropped relic can lead it away.' });
  object(courier, 'rescue', 'neri', 17, 3, { name: 'Neri', text: 'Light the whole garden, then return for me. I know the way the train used to sing.' });
  object(courier, 'lever', 'amber-wheel', 5, 5, { name: 'Amber wheel', channel: 'amber' }); object(courier, 'door', 'lower-door', 10, 7, { channel: 'amber' });
  object(courier, 'lever', 'jade-wheel', 15, 10, { name: 'Jade wheel', channel: 'jade' }); object(courier, 'door', 'upper-door', 10, 3, { channel: 'jade' });
  object(courier, 'hunter', 'listener', 15, 8, { route: [{ x: 15, y: 8 }, { x: 17, y: 8 }], vision: 4 });
  for (const [i, x, y] of [[0, 7, 4], [1, 13, 5], [2, 18, 11]]) object(courier, 'coin', `coin-${i}`, x, y);
  return [post, bridge, courier].map(normalizeAdventure);
}
