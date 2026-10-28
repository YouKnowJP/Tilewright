import { createDocument } from './model.mjs';

const point = (id, x, y, extra = {}) => ({ id, x, y, ...extra });
const markers = (cells, prefix) => cells.map(([x, y], i) => point(`${prefix}-${i}`, x, y));
const bell = (id, name, x, y) => point(id, x, y, { name });
const wheel = (id, name, x, y, description, initial = false) => point(id, x, y, { name, description, initial });
const gate = (id, x, y, controls, water = false) => point(id, x, y, { type: 'switch', controls: Object.entries(controls).map(([id, on]) => ({ id, on })), ...(water ? { appearance: 'sluice' } : {}) });
const span = (id, cells, controls) => cells.map(([x, y], i) => gate(`${id}-${i}`, x, y, controls, true));
const hunter = (id, cells, extra = {}) => ({ id, route: cells.map(([x, y]) => ({ x, y })), vision: 7, ...extra });
const keeper = (id, name, x, y, lines, choices = [], after) => point(id, x, y, { name, lines, choices, after });
const choice = (id, label, response, effect) => ({ id, label, response, effect });
const embers = (cells, disabledBy, offset = 0) => cells.map(([x, y]) => ({ x, y, period: 5, phases: [2, 3], offset, disabledBy }));
const patch = (x, y) => [{ x, y }, { x: x + 1, y }, { x, y: y + 1 }, { x: x + 1, y: y + 1 }];
function paint(map, x, y, floor, detail = 0) { const i = y * map.width + x; map.layers[0].tiles[i] = floor; map.layers[1].tiles[i] = detail; }
function room(name, width, height, floor) {
  const map = createDocument(name, width, height); map.layers[0].tiles.fill(floor);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (!x || !y || x === width - 1 || y === height - 1) paint(map, x, y, floor, floor === 6 ? 9 : 7);
    else if ((x * 17 + y * 11) % 47 === 0) map.layers[1].tiles[y * width + x] = 10;
  }
  return map;
}
function block(map, left, top, right, bottom, floor = 6, detail = 9) {
  for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) paint(map, x, y, floor, detail);
}
function enclosure(map, left, top, right, bottom, door) {
  block(map, left, top, right, top); block(map, left, bottom, right, bottom);
  block(map, left, top, left, bottom); block(map, right, top, right, bottom);
  paint(map, door.x, door.y, 6);
}
function path(map, cells) {
  let [x, y] = cells[0];
  const mark = () => { const i = y * map.width + x; if (map.layers[0].tiles[i] !== 3 && !map.layers[1].tiles[i]) map.layers[0].tiles[i] = 5; };
  mark();
  for (const [tx, ty] of cells.slice(1)) {
    while (x !== tx) { x += Math.sign(tx - x); mark(); }
    while (y !== ty) { y += Math.sign(ty - y); mark(); }
  }
}
function base(number, name, map, start, exit, par) {
  return { id: `trail-${number}`, name, map, start, exit, par, lanterns: [], keys: [], coins: [], hearts: [], supplies: [], crates: [], plates: [], gates: [], enemies: [], hunters: [], npcs: [], cover: [], hazards: [], switches: [] };
}

// Nine authored maps. Geometry and mission plans deliberately differ; no generated
// expedition layouts or checkpoint rules change when the atlas grows.
export function createAtlasSaga() {
  const stacks = room('Whispering Stacks', 28, 20, 6);
  block(stacks, 13, 1, 13, 18); for (const y of [5, 14]) paint(stacks, 13, y, 6);
  for (const [x, y] of [[6, 6], [6, 12], [18, 6], [21, 10]]) block(stacks, x, y, x + 2, y + 1);
  const market = room('The Ink Market', 30, 22, 6);
  for (const [x, y] of [[7, 6], [19, 6], [7, 14], [19, 14]]) block(market, x, y, x + 3, y + 2);
  const observatory = room('Archivist’s Observatory', 32, 24, 6);
  block(observatory, 1, 11, 30, 13, 3, 0);
  enclosure(observatory, 24, 17, 29, 22, { x: 24, y: 19 });
  block(observatory, 14, 4, 17, 6); block(observatory, 14, 17, 17, 19);
  const caravan = room('Cinder Caravan', 28, 20, 4);
  block(caravan, 12, 1, 14, 18, 3, 0); block(caravan, 5, 5, 7, 7, 4, 7); block(caravan, 20, 10, 22, 12, 4, 9);
  const bazaar = room('The Sunken Bazaar', 30, 22, 4);
  block(bazaar, 14, 1, 14, 20); for (const y of [5, 16]) paint(bazaar, 14, y, 4);
  for (const [x, y] of [[5, 6], [8, 13], [20, 6], [23, 13]]) block(bazaar, x, y, x + 2, y + 2, 4, 9);
  const furnace = room('The Furnace Choir', 32, 24, 4);
  block(furnace, 15, 1, 15, 22); for (const y of [6, 17]) paint(furnace, 15, y, 4);
  enclosure(furnace, 24, 3, 30, 10, { x: 24, y: 7 }); block(furnace, 8, 8, 10, 11, 4, 9);
  const post = room('Frostline Post', 28, 20, 2);
  block(post, 13, 1, 13, 18, 2, 7); paint(post, 13, 9, 2);
  block(post, 5, 6, 8, 7, 2, 7); block(post, 19, 10, 22, 11, 2, 9);
  const mirrors = room('Mirror Reservoir', 32, 22, 6);
  block(mirrors, 14, 1, 16, 20, 3, 0); block(mirrors, 6, 6, 9, 8); block(mirrors, 22, 12, 25, 14);
  const engine = room('The Aurora Engine', 36, 26, 2);
  block(engine, 16, 1, 18, 24, 3, 0);
  enclosure(engine, 27, 3, 33, 10, { x: 27, y: 7 });
  enclosure(engine, 2, 18, 8, 24, { x: 8, y: 21 });
  block(engine, 8, 7, 10, 9, 2, 7); block(engine, 23, 13, 25, 15, 6, 9);
  // Worn routes add landmarks without changing a wall, river, or collision cell.
  path(stacks, [[3, 16], [3, 10], [10, 10], [10, 3], [24, 3], [24, 16]]); path(stacks, [[3, 14], [24, 14]]); path(stacks, [[9, 5], [24, 5]]);
  path(market, [[4, 3], [4, 18], [26, 18], [26, 3], [4, 3]]); path(market, [[13, 3], [13, 18]]); path(market, [[3, 11], [27, 11]]);
  path(observatory, [[3, 7], [26, 7], [26, 20], [4, 20], [4, 18]]); path(observatory, [[8, 4], [8, 20]]); path(observatory, [[25, 5], [25, 20]]);
  path(caravan, [[4, 3], [4, 16], [24, 16], [24, 4]]); path(caravan, [[3, 10], [24, 10]]);
  path(bazaar, [[4, 3], [4, 18], [26, 18], [26, 3]]); path(bazaar, [[10, 3], [10, 18]]); path(bazaar, [[4, 5], [26, 5]]); path(bazaar, [[4, 16], [26, 16]]);
  path(furnace, [[4, 4], [11, 4], [11, 19], [28, 19], [28, 5]]); path(furnace, [[11, 6], [28, 6]]); path(furnace, [[11, 17], [28, 17]]);
  path(post, [[4, 3], [4, 16], [24, 16], [24, 4]]); path(post, [[4, 9], [24, 9]]);
  path(mirrors, [[4, 4], [11, 4], [11, 18], [27, 18], [27, 4]]); for (const y of [5, 11, 17]) path(mirrors, [[11, y], [27, y]]);
  path(engine, [[5, 4], [12, 4], [12, 21], [30, 21], [30, 5]]); for (const y of [6, 12, 20]) path(engine, [[5, y], [30, y]]);
  return [
    { ...base(10, 'Whispering Stacks', stacks, { x: 3, y: 10 }, { x: 3, y: 16 }, 90), contractStart: true,
      subtitle: 'A library that rearranges its exits', tags: ['Route reversal', 'Relic delivery'],
      lanterns: markers([[4, 4], [23, 4], [24, 16]], 'lamp'), coins: markers([[4, 15], [10, 3], [19, 15], [24, 8]], 'coin'),
      hearts: markers([[10, 10], [21, 17]], 'heart'), supplies: markers([[10, 15], [24, 12]], 'supply'),
      switches: [wheel('index', 'Index wheel', 9, 5, 'Open the upper archive door until the Return wheel is on.'), wheel('return', 'Return wheel', 20, 14, 'Close the upper door; open the lower door for your return.')], requiredSwitches: ['index', 'return'],
      gates: [gate('upper', 13, 5, { index: true, return: false }), gate('lower', 13, 14, { return: true })],
      relays: [bell('ink', 'Ink bell', 7, 3), bell('echo', 'Echo bell', 24, 14)], sequence: ['ink', 'echo'],
      relic: point('relic', 23, 13, { name: 'Whispering folio' }), delivery: { x: 3, y: 16 },
      hunters: [hunter('page-turner', [[10, 10], [10, 14]]), hunter('ink-listener', [[21, 10], [24, 10]]), hunter('night-reader', [[18, 3], [18, 16]], { nemesisOnly: true })],
      cover: [...patch(4, 8), ...patch(17, 10), ...patch(23, 17)],
      npcs: [keeper('ves', 'Ves', 2, 10, ['“The books whisper louder when carried. Ring Ink, then Echo. Bring the folio to the west beacon.”', 'Index opens the upper door; Return opens the lower one. Read the hunters’ next steps before taking the folio.'], [choice('echoes', 'Pack two paper echoes', '“Let them chase an unwritten story.” Two decoys packed.', { decoys: 2 }), choice('binding', 'Take a protective binding', '“Keep the last page safe.” One shield packed.', { shields: 1 })])],
      endingChoice: 'ves', epilogues: { echoes: 'The hunters chase blank pages while Ves reads your story aloud.', binding: 'The folio reaches Ves without losing a page. A new route appears in the atlas.' },
      intro: 'A living library, two changing doors, and a folio that gives away your position. Retrieve its story and bring it home.',
      hint: 'Ring Ink in the northwest and turn Index. Cross the upper door, restore the eastern lamps, ring Echo, turn Return, and carry the folio back through the lower door.' },
    { ...base(11, 'The Ink Market', market, { x: 3, y: 11 }, { x: 26, y: 18 }, 175),
      subtitle: 'A walking-only treasure circuit', tags: ['No dashing', 'Every coin'], restrictions: { noDash: true }, requireCoins: true,
      lanterns: markers([[4, 4], [25, 4], [25, 18]], 'lamp'), coins: markers([[4, 16], [12, 18], [16, 12], [26, 12], [24, 3], [16, 3], [11, 4], [4, 3]], 'coin'),
      hearts: markers([[13, 11], [26, 17]], 'heart'), supplies: markers([[12, 12], [18, 18]], 'supply'),
      switches: [wheel('quiet', 'Quiet press', 16, 10, 'Cool the central ink embers. Recommended for the treasure circuit.')],
      hazards: embers([[15, 11], [16, 11], [17, 11]], 'quiet'),
      relays: [bell('quill', 'Quill bell', 5, 17), bell('seal', 'Seal bell', 25, 16), bell('letter', 'Letter bell', 11, 3)], sequence: ['quill', 'seal', 'letter'],
      hunters: [hunter('ink-taxman', [[12, 7], [16, 7]], { vision: 6 }), hunter('stamp-guard', [[23, 11], [26, 11]], { vision: 6 }), hunter('night-clerk', [[18, 3], [18, 18]], { nemesisOnly: true, vision: 6 })],
      cover: [...patch(4, 12), ...patch(12, 15), ...patch(16, 5), ...patch(25, 9)],
      npcs: [keeper('nib', 'Nib', 2, 11, ['“No running in the market! Collect every lost coin. Quill, Seal, Letter is our opening tune.”', 'Walking restores energy. Use cover, echoes, and the Quiet press to stay ahead of the listeners.'])],
      ending: 'Nib returns the recovered coins to eight relieved shopkeepers. The market opens at dawn.',
      intro: 'An entire market to explore at walking pace. Recover all eight coins, ring three bells in order, and bring light back to its stalls.',
      hint: 'Dash is disabled on this mission. Sweep the southern stalls, ring Quill then Seal, then search the north and ring Letter. The Quiet press cools the central lane.' },
    { ...base(12, 'Archivist’s Observatory', observatory, { x: 3, y: 7 }, { x: 4, y: 7 }, 175), actFinal: true, nemesisStart: 9,
      subtitle: 'Finale · the river of forgotten stars', tags: ['Watcher', 'Rescue', 'Two crossings'],
      lanterns: markers([[10, 4], [26, 5], [4, 18], [27, 20]], 'lamp'), keys: markers([[21, 4]], 'key'), coins: markers([[4, 4], [18, 7], [9, 20], [22, 21]], 'coin'),
      hearts: markers([[12, 8], [22, 17]], 'heart'), supplies: markers([[9, 8], [20, 18], [26, 16]], 'supply'),
      switches: [wheel('orbit-drive', 'Orbit wheel', 7, 8, 'Raise the west observatory bridge.'), wheel('dawn', 'Dawn wheel', 26, 16, 'Raise the east bridge and close the west bridge.')], requiredSwitches: ['orbit-drive', 'dawn'],
      gates: [...span('west', [[8, 11], [8, 12], [8, 13]], { 'orbit-drive': true, dawn: false }), ...span('east', [[25, 11], [25, 12], [25, 13]], { dawn: true }), point('archive-key', 24, 19, { type: 'key' })],
      relays: [bell('orbit', 'Orbit bell', 9, 4), bell('dusk', 'Dusk bell', 8, 18), bell('star', 'Star bell', 25, 18)], sequence: ['orbit', 'dusk', 'star'],
      relic: point('relic', 27, 18, { name: 'Star ledger' }), delivery: { x: 4, y: 7 }, requiredRescues: ['tess'],
      npcs: [keeper('ves', 'Ves', 2, 7, ['“Orbit, Dusk, Star. Bring Tess and the ledger back across the east bridge. The Watcher grows stronger with every lamp.”']), keeper('tess', 'Tess', 27, 21, ['“I can read the stars when every lamp is burning. Come back for me then.”'], [], '“The ledger remembers everyone. I will follow you home.”')],
      hunters: [hunter('archivist', [[21, 16], [27, 16]], { boss: true, vision: 8 }), hunter('orbit-guard', [[19, 7], [25, 7]]), hunter('dusk-guard', [[10, 15], [10, 20]], { nemesisOnly: true })],
      cover: [...patch(5, 8), ...patch(20, 5), ...patch(9, 16), ...patch(21, 20)],
      resultTitle: 'No star is forgotten.', ending: 'Tess charts a sky full of names. Ves adds yours beside the quietest star.',
      intro: 'Cross a river of stars, recover the ledger, and rescue Tess. A four-lantern Watcher finale with a different route home.',
      hint: 'Collect the north-bank key and ring Orbit first. Use the west bridge to reach Dusk, restore the southern lights, rescue Tess, and recover the ledger. Dawn opens the east return bridge.' },
    { ...base(13, 'Cinder Caravan', caravan, { x: 3, y: 10 }, { x: 24, y: 16 }, 80), contractStart: true,
      subtitle: 'A crate bridge through the amber dunes', tags: ['Crate puzzle', 'Oasis choice'],
      lanterns: markers([[4, 3], [9, 16], [24, 4]], 'lamp'), coins: markers([[4, 15], [10, 3], [19, 5], [25, 14]], 'coin'), hearts: markers([[9, 13], [23, 15]], 'heart'), supplies: markers([[10, 14], [20, 15]], 'supply'),
      crates: [point('wagon', 6, 10)], plates: [point('brake', 7, 10)], gates: [12, 13, 14].map(x => point(`caravan-${x}`, x, 10, { type: 'bridge', plates: ['brake'] })),
      switches: [wheel('oasis', 'Oasis pump', 9, 5, 'Cool the hot eastern caravan lane.')], hazards: embers([[18, 9], [19, 9], [20, 9], [21, 9]], 'oasis'),
      hunters: [hunter('dune-listener', [[9, 8], [9, 13]]), hunter('caravan-guard', [[21, 6], [24, 6]]), hunter('sand-scout', [[19, 13], [24, 13]], { nemesisOnly: true })], cover: [...patch(4, 12), ...patch(9, 6), ...patch(18, 5), ...patch(24, 12)],
      npcs: [keeper('saff', 'Saff', 2, 10, ['“Push the wagon east once, onto its brake. I can start the oasis pump, or give you supplies for the hot road.”'], [choice('water', 'Ask Saff to cool the oasis', '“Water first. Everything else can wait.” The hot road cools.', { switches: { oasis: true } }), choice('supplies', 'Pack a shield and a decoy', '“Travel with a trick up your sleeve.” The pump can still be turned by hand.', { shields: 1, decoys: 1 })])],
      endingChoice: 'saff', epilogues: { water: 'The caravan follows the sound of water into a green tomorrow.', supplies: 'Saff retells your crossing with increasingly improbable sound effects.' },
      intro: 'A stranded caravan needs a bridge. Set the wagon brake, choose water or supplies, and cross the listening dunes.',
      hint: 'Stand west of the wagon and push it one tile east onto the copper brake. The bridge opens across the central river. The Oasis pump is optional and can always be operated by hand.' },
    { ...base(14, 'The Sunken Bazaar', bazaar, { x: 3, y: 11 }, { x: 26, y: 18 }, 115),
      subtitle: 'Six lost heirlooms, without a shield', tags: ['No shields', 'Treasure hunt'], requireCoins: true, restrictions: { noShield: true },
      lanterns: markers([[4, 4], [24, 4], [26, 18]], 'lamp'), coins: markers([[4, 17], [11, 18], [10, 3], [20, 4], [27, 11], [21, 18]], 'coin'), hearts: markers([[11, 11], [24, 17]], 'heart'), supplies: markers([[11, 15], [20, 12]], 'supply'),
      switches: [wheel('sun', 'Sun awning', 9, 5, 'Open the upper bazaar arch.'), wheel('moon', 'Moon awning', 10, 16, 'Open the lower bazaar arch.')], requiredSwitches: ['moon'],
      gates: [gate('sun-arch', 14, 5, { sun: true }), gate('moon-arch', 14, 16, { moon: true })],
      hunters: [hunter('brass-collector', [[11, 8], [11, 13]], { vision: 6 }), hunter('glass-collector', [[20, 10], [24, 10]], { vision: 6 }), hunter('night-collector', [[18, 4], [18, 17]], { nemesisOnly: true, vision: 6 })], cover: [...patch(4, 11), ...patch(10, 6), ...patch(17, 6), ...patch(25, 16)],
      npcs: [keeper('saff', 'Saff', 2, 11, ['“The sand has swallowed six heirlooms. No shields here: use echoes and cover.”', 'Both awnings can stay open. Moon must be raised before the market can reopen.'], [choice('passage', 'Open Sun from the keeper’s desk', '“A clear route to start.” Sun opens; Moon is still yours to raise.', { switches: { sun: true } }), choice('echoes', 'Take two sand echoes', '“Let the collectors count shadows.” Two decoys packed.', { decoys: 2 })])],
      ending: 'Six heirlooms, six stories returned. The market’s awnings rise over a crowd again.',
      intro: 'Recover every lost heirloom in a shield-free bazaar. Open two independent routes and outwit collectors with decoys and cover.',
      hint: 'Gather the three western coins and raise Moon before crossing. Sun is optional. Search the east stalls for the other three coins. Shields are disabled; the forecast and cover are your best tools.' },
    { ...base(15, 'The Furnace Choir', furnace, { x: 3, y: 12 }, { x: 28, y: 20 }, 175), actFinal: true, nemesisStart: 12,
      subtitle: 'Finale · four bells in the sleeping forge', tags: ['Four-note lock', 'Two rescues', 'Watcher'],
      lanterns: markers([[4, 4], [11, 19], [28, 5], [27, 19]], 'lamp'), keys: markers([[11, 4]], 'key'), coins: markers([[4, 20], [12, 7], [21, 4], [29, 16]], 'coin'), hearts: markers([[12, 14], [21, 18]], 'heart'), supplies: markers([[11, 13], [20, 7], [25, 18]], 'supply'),
      switches: [wheel('draft', 'Draft regulator', 10, 6, 'Open the upper forge arch.'), wheel('cool', 'Cooling choir', 21, 16, 'Open the lower forge arch and cool the furnace floor.')], requiredSwitches: ['draft', 'cool'],
      gates: [gate('draft-arch', 15, 6, { draft: true }), gate('cool-arch', 15, 17, { cool: true }), point('choir-vault', 24, 7, { type: 'key' })],
      relays: [bell('ash', 'Ash bell', 5, 4), bell('brass', 'Brass bell', 11, 18), bell('coal', 'Coal bell', 22, 5), bell('song', 'Song bell', 27, 18)], sequence: ['ash', 'brass', 'coal', 'song'],
      hazards: [...embers([[20, 10], [21, 10], [22, 10], [23, 10]], 'cool'), ...embers([[25, 15], [26, 15], [27, 15]], 'cool', 1)],
      hunters: [hunter('choirmaster', [[21, 12], [27, 12]], { boss: true, vision: 8 }), hunter('ash-keeper', [[12, 9], [12, 15]]), hunter('coal-keeper', [[19, 4], [19, 18]], { nemesisOnly: true })], cover: [...patch(4, 9), ...patch(10, 14), ...patch(18, 7), ...patch(27, 16)],
      npcs: [keeper('saff', 'Saff', 2, 12, ['“Ash, Brass, Coal, Song. A cold furnace can still have a warm voice.”', 'Find Rami in the brass vault and Odo in the south. Both will follow after every lamp is lit.']), keeper('rami', 'Rami', 28, 8, ['“The lamps first. Then I will lend you my voice.”'], [], '“One more voice in the choir. Lead on.”'), keeper('odo', 'Odo', 29, 20, ['“I am not leaving Rami behind. Bring every lamp back.”'], [], '“The forge can sleep. We are going home.”')], requiredRescues: ['rami', 'odo'],
      resultTitle: 'The furnace finds its voice.', ending: 'Rami and Odo sing a tune the Watcher never learned. The caravan carries it into the next valley.',
      intro: 'A four-note furnace lock and two missing singers. Restore four lamps, cool the forge, and bring the choir together under a Watcher’s gaze.',
      hint: 'Ring Ash then Brass on the west side, collect the key, and open Draft. Cross north for Coal and the vault lamp. Cool the south lanes, ring Song, restore every lamp, then rescue Rami and Odo.' },
    { ...base(16, 'Frostline Post', post, { x: 3, y: 10 }, { x: 4, y: 16 }, 140), contractStart: true,
      subtitle: 'A quiet delivery beneath the aurora', tags: ['No dashing', 'Relic delivery'], restrictions: { noDash: true },
      lanterns: markers([[4, 3], [23, 4], [24, 16]], 'lamp'), coins: markers([[4, 15], [10, 4], [19, 5], [25, 14]], 'coin'), hearts: markers([[10, 12], [24, 13]], 'heart'), supplies: markers([[11, 9], [20, 15]], 'supply'),
      switches: [wheel('post', 'Postern wheel', 10, 9, 'Open the central frost gate.')], requiredSwitches: ['post'], gates: [gate('frost-gate', 13, 9, { post: true })],
      relic: point('relic', 24, 5, { name: 'Northern message' }), delivery: { x: 4, y: 16 },
      hunters: [hunter('snow-listener', [[10, 5], [10, 14]], { vision: 6 }), hunter('ice-ranger', [[20, 6], [24, 6]], { vision: 6 }), hunter('frost-scout', [[18, 13], [24, 13]], { nemesisOnly: true, vision: 6 })], cover: [...patch(4, 10), ...patch(10, 15), ...patch(17, 7), ...patch(24, 14)],
      npcs: [keeper('elu', 'Elu', 2, 10, ['“The post is quiet, but the message sings. Walking only: the ice will not take a dash.”', 'You can put the message down with X to make a false trail, then retrieve it with E.'], [choice('echoes', 'Take two snow echoes', '“Make the snow remember someone else.” Two decoys packed.', { decoys: 2 }), choice('ward', 'Take a winter ward', '“For the long way back.” One shield packed.', { shields: 1 })])],
      ending: 'The northern message reaches its reader. Elu lights a small lamp in the post window.',
      intro: 'Carry a singing message through a frozen listening post. Walk quietly, use the gate, and find a different story for the hunters to follow.',
      hint: 'Light the west lamp, turn Postern, and collect both eastern lamps before taking the message. Walk back through the gate to the southwest beacon; set the message down if you need to divert a hunter.' },
    { ...base(17, 'Mirror Reservoir', mirrors, { x: 3, y: 11 }, { x: 27, y: 18 }, 135),
      subtitle: 'Three bridges and a reflected melody', tags: ['Logic bridges', 'Every coin', 'Four-note lock'], requireCoins: true,
      lanterns: markers([[4, 4], [27, 4], [28, 18]], 'lamp'), coins: markers([[4, 17], [11, 18], [11, 4], [21, 4], [28, 11], [21, 18]], 'coin'), hearts: markers([[11, 11], [26, 16]], 'heart'), supplies: markers([[11, 15], [20, 11]], 'supply'),
      switches: [wheel('silver', 'Silver mirror', 9, 4, 'Silver alone raises the north bridge.'), wheel('blue', 'Blue mirror', 10, 17, 'Blue alone raises the south bridge; both mirrors raise the middle bridge.')], requiredSwitches: ['silver', 'blue'],
      gates: [...span('north', [[14, 5], [15, 5], [16, 5]], { silver: true, blue: false }), ...span('middle', [[14, 11], [15, 11], [16, 11]], { silver: true, blue: true }), ...span('south', [[14, 17], [15, 17], [16, 17]], { silver: false, blue: true })],
      relays: [bell('snow', 'Snow bell', 5, 17), bell('moon', 'Moon bell', 11, 3), bell('sky', 'Sky bell', 26, 4), bell('lake', 'Lake bell', 27, 17)], sequence: ['snow', 'moon', 'sky', 'lake'],
      hunters: [hunter('mirror-hunter', [[11, 8], [11, 13]]), hunter('reflection', [[23, 8], [27, 8]]), hunter('lake-hunter', [[20, 15], [27, 15]], { nemesisOnly: true })], cover: [...patch(4, 12), ...patch(10, 6), ...patch(18, 8), ...patch(27, 14)],
      npcs: [keeper('elu', 'Elu', 2, 11, ['“Snow, Moon, Sky, Lake. Every coin is a fragment of the reflection.”', 'Both mirrors must be on at the finish. Change one mirror at a time and check which bridge will close.'])],
      ending: 'The reservoir reflects a whole sky again. Six fragments become one clear memory.',
      intro: 'Reassemble a reflection: six coins, a four-note melody, and three bridges controlled by two mirrors. Finish with both mirrors aligned.',
      hint: 'Gather the western coins and ring Snow then Moon. Turn both mirrors on to raise the central bridge. Cross, search the eastern bank, then ring Sky and Lake.' },
    { ...base(18, 'The Aurora Engine', engine, { x: 3, y: 12 }, { x: 4, y: 21 }, 220), actFinal: true, nemesisStart: 15, optionalPlates: true,
      subtitle: 'Finale · bring the whole sky home', tags: ['Four lanterns', 'Rescue convoy', 'Watcher', 'Relic delivery'],
      lanterns: markers([[5, 4], [11, 21], [30, 5], [30, 21]], 'lamp'), keys: markers([[12, 4]], 'key'), coins: markers([[4, 6], [12, 18], [22, 4], [32, 13], [31, 23]], 'coin'), hearts: markers([[13, 13], [23, 20]], 'heart'), supplies: markers([[12, 13], [21, 9], [29, 17]], 'supply'),
      switches: [wheel('north', 'North prism', 10, 5, 'Raise the north crossing until the Home prism is on.'), wheel('home', 'Home prism', 22, 18, 'Open the south crossing and close the north crossing.'), wheel('storm', 'Storm prism', 21, 7, 'Cool the engine’s storm lanes.')], requiredSwitches: ['north', 'home', 'storm'],
      crates: [point('weight-a', 7, 12), point('weight-b', 11, 14)], plates: [point('plate-a', 8, 12), point('plate-b', 12, 14)],
      gates: [...span('north', [[16, 6], [17, 6], [18, 6]], { north: true, home: false }), ...span('south', [[16, 20], [17, 20], [18, 20]], { home: true }),
        ...[16, 17, 18].map(x => point(`weight-bridge-${x}`, x, 12, { type: 'bridge', plates: ['plate-a', 'plate-b'] })), point('aurora-key', 27, 7, { type: 'key' }), point('home-signal', 8, 21, { type: 'signal' })],
      relays: [bell('root', 'Root bell', 5, 5), bell('frost', 'Frost bell', 11, 20), bell('star', 'Star bell', 25, 5), bell('dawn', 'Dawn bell', 28, 20)], sequence: ['root', 'frost', 'star', 'dawn'],
      relic: point('relic', 30, 7, { name: 'Aurora heart' }), delivery: { x: 4, y: 21 }, requiredRescues: ['tess', 'rami'],
      hazards: [...embers([[20, 11], [21, 11], [22, 11], [23, 11]], 'storm'), ...embers([[27, 16], [28, 16], [29, 16], [30, 16]], 'storm', 1)],
      hunters: [hunter('aurora-watcher', [[22, 12], [29, 12]], { boss: true, vision: 8 }), hunter('prism-hunter', [[12, 8], [12, 16]]), hunter('polar-ranger', [[21, 20], [27, 20]], { nemesisOnly: true })], cover: [...patch(5, 9), ...patch(12, 16), ...patch(20, 5), ...patch(29, 18)],
      npcs: [keeper('elu', 'Elu', 2, 12, ['“Root, Frost, Star, Dawn. The heart belongs to everyone. Bring Tess and Rami back with it.”', 'The north crossing gets you in; Home opens the south crossing for the return. The two optional weights make a permanent middle bridge.'], [choice('storm', 'Ask Elu to quiet the storm', '“I can hold the storm prism from here.” Storm lanes cool; you still control the crossings.', { switches: { storm: true } }), choice('kit', 'Take a ward and two echoes', '“Then bring your own dawn.” Operate the Storm prism on the eastern bank.', { shields: 1, decoys: 2 })]), keeper('tess', 'Tess', 31, 8, ['“The heart has a song, but it needs every lamp. Come back when the sky is ready.”'], [], '“I have the stars. You carry the dawn.”'), keeper('rami', 'Rami', 31, 22, ['“We finish this together. Every lamp, every voice.”'], [], '“One last walk. I will keep the others close.”')],
      resultTitle: 'You brought the whole sky home.', endingChoice: 'elu', epilogues: { storm: 'Elu releases the storm. Tess and Rami raise the aurora heart; every trail in the atlas shines.', kit: 'The last echoes fade. Your little convoy carries the dawn into eighteen newly lit trails.' },
      intro: 'The longest story finale: four lamps, four notes, two keepers, a singing heart, and three prisms. Build an optional middle bridge or reverse the northern route for your return.',
      hint: 'Find the west key, light both west lamps, and ring Root then Frost. Raise North, cross, quiet Storm, ring Star then Dawn, and light both east lamps. Rescue Tess and Rami, take the heart, turn Home, and return south.' },
  ];
}
