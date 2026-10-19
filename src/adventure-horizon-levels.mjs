import { createDocument } from './model.mjs';

const p = (id, x, y, extra = {}) => ({ id, x, y, ...extra });
const marks = (cells, prefix) => cells.map(([x, y], i) => p(`${prefix}-${i}`, x, y));
const bell = (id, name, x, y) => p(id, x, y, { name });
const wheel = (id, name, x, y, description) => p(id, x, y, { name, description, initial: false });
const gate = (id, x, y, controls, water = false) => p(id, x, y, { type: 'switch', controls: Object.entries(controls).map(([id, on]) => ({ id, on })), ...(water ? { appearance: 'sluice' } : {}) });
const span = (id, cells, controls) => cells.map(([x, y], i) => gate(`${id}-${i}`, x, y, controls, true));
const hunter = (id, cells, extra = {}) => ({ id, route: cells.map(([x, y]) => ({ x, y })), vision: 6, ...extra });
const keeper = (id, name, x, y, lines, choices = [], after) => p(id, x, y, { name, lines, choices, after });
const choice = (id, label, response, effect) => ({ id, label, response, effect });
const cover = (x, y) => [{ x, y }, { x: x + 1, y }, { x, y: y + 1 }, { x: x + 1, y: y + 1 }];
const heat = (cells, disabledBy) => cells.map(([x, y], i) => ({ x, y, period: 5, phases: [2, 3], offset: i % 2, disabledBy }));
function paint(map, x, y, floor, detail = 0) { const i = y * map.width + x; map.layers[0].tiles[i] = floor; map.layers[1].tiles[i] = detail; }
function block(map, left, top, right, bottom, floor = 6, detail = 9) {
  for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) paint(map, x, y, floor, detail);
}
function room(name, width, height, floor) {
  const map = createDocument(name, width, height); map.layers[0].tiles.fill(floor);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (!x || !y || x === width - 1 || y === height - 1) paint(map, x, y, floor, floor === 1 ? 7 : 9);
    else if ((x * 13 + y * 23) % 59 === 0) map.layers[1].tiles[y * width + x] = 10;
    else if (x % 7 === 3 || y % 6 === 4) paint(map, x, y, 5);
  }
  return map;
}
function frame(map, left, top, right, bottom, door) {
  block(map, left, top, right, top); block(map, left, bottom, right, bottom);
  block(map, left, top, left, bottom); block(map, right, top, right, bottom);
  paint(map, door[0], door[1], 6);
}
function base(number, name, map, start, exit, par) {
  return { id: `trail-${number}`, name, map, start, exit, par, lanterns: [], keys: [], coins: [], hearts: [], crates: [], plates: [], gates: [], enemies: [], hunters: [], npcs: [], relays: [], switches: [], hazards: [], cover: [], supplies: [] };
}

// Six authored missions with independent geometry and public-rule route plans.
export function createHorizonSaga() {
  const tide = room('Tideglass Causeway', 26, 18, 4);
  block(tide, 1, 8, 24, 9, 3, 0); frame(tide, 18, 11, 24, 16, [18, 14]);
  block(tide, 13, 2, 15, 3); block(tide, 4, 11, 6, 12);
  const race = room('The Lantern Regatta', 30, 20, 6);
  block(race, 10, 1, 11, 18, 3, 0); block(race, 20, 1, 21, 18, 3, 0);
  frame(race, 24, 13, 28, 18, [24, 16]); block(race, 14, 8, 16, 10); block(race, 4, 7, 6, 8);
  const light = room('The Last Lighthouse', 32, 24, 6);
  block(light, 1, 11, 30, 12, 3, 0); frame(light, 2, 2, 7, 6, [7, 4]); frame(light, 23, 15, 30, 22, [23, 18]);
  block(light, 14, 5, 16, 7); block(light, 12, 17, 14, 19);
  const garden = room('Clockvine Gardens', 28, 20, 1);
  block(garden, 11, 1, 11, 18, 1, 7); block(garden, 20, 1, 20, 18, 1, 7);
  for (const [x, y] of [[11, 6], [11, 14], [20, 10]]) paint(garden, x, y, 5);
  block(garden, 14, 6, 16, 7, 1, 7); block(garden, 23, 13, 24, 14, 1, 7);
  const market = room('The Midnight Market', 30, 22, 6);
  for (const y of [7, 14]) { block(market, 1, y, 28, y); for (const x of [8, 23]) paint(market, x, y, 6); }
  frame(market, 23, 16, 28, 20, [23, 18]); block(market, 12, 9, 14, 10);
  const orchard = room('The Orchard That Woke', 34, 26, 1);
  block(orchard, 16, 1, 16, 24, 1, 7); for (const y of [6, 13, 21]) paint(orchard, 16, y, 5);
  frame(orchard, 2, 18, 8, 24, [8, 21]); frame(orchard, 26, 3, 31, 9, [26, 6]);
  block(orchard, 6, 7, 8, 9, 1, 7); block(orchard, 21, 15, 23, 16, 1, 7);
  return [
    { ...base(19, 'Tideglass Causeway', tide, { x: 3, y: 5 }, { x: 3, y: 6 }, 115), contractStart: true,
      subtitle: 'One tide out. Another way home.', tags: ['Changing crossings', 'Locked sea vault'],
      lanterns: marks([[4, 2], [22, 3], [22, 14]], 'lamp'), keys: marks([[8, 3]], 'key'), coins: marks([[5, 6], [23, 5], [12, 14], [21, 15]], 'coin'),
      hearts: marks([[9, 6], [14, 14]], 'heart'), supplies: marks([[8, 12], [22, 12]], 'supply'),
      switches: [wheel('ebb', 'Ebb winch', 6, 5, 'Raise the western causeway until Home is on.'), wheel('home', 'Home winch', 6, 14, 'Close the western causeway and raise the eastern route home.')], requiredSwitches: ['ebb', 'home'],
      gates: [...span('west-tide', [[10, 8], [10, 9]], { ebb: true, home: false }), ...span('east-tide', [[20, 8], [20, 9]], { home: true }), p('sea-key', 18, 14, { type: 'key' })],
      npcs: [keeper('tala', 'Tala', 2, 5, ['“Take the north-bank key before you cross. The last lamp is inside the sea vault.”', '“Ebb carries you south. Home closes that route and raises the eastern return. Watch the outlined hunter steps.”'], [choice('echoes', 'Pack two shell echoes', '“Let the shore listen to something else.” Two decoys packed.', { decoys: 2 }), choice('ward', 'Take a sea-glass ward', '“Keep this for the crossing.” One shield packed.', { shields: 1 })])],
      hunters: [hunter('shore-listener', [[19, 5], [23, 5]]), hunter('tide-runner', [[12, 13], [16, 13]]), hunter('night-diver', [[21, 12], [23, 12]], { nemesisOnly: true })],
      cover: [...cover(5, 5), ...cover(18, 4), ...cover(11, 11), ...cover(20, 14)],
      intro: 'Relight the sea vault and return to Tala. Your outbound crossing closes when you prepare the way home.',
      hint: 'Find the north-bank key northeast of Tala, turn Ebb, and cross the western causeway. Restore the sea-vault lamp. Turn Home on the south bank, then return by the eastern crossing.',
      ending: 'Tala hangs a sea-glass lantern above the returning tide. The coast has a way home again.' },
    { ...base(20, 'The Lantern Regatta', race, { x: 3, y: 10 }, { x: 26, y: 16 }, 120),
      subtitle: 'Three islands. Every lost racing token.', tags: ['Island treasure circuit', 'Three-note lock'], requireCoins: true,
      lanterns: marks([[5, 14], [16, 4], [26, 10]], 'lamp'), coins: marks([[4, 15], [7, 3], [15, 4], [16, 16], [26, 3], [27, 11]], 'coin'),
      hearts: marks([[8, 12], [18, 13]], 'heart'), supplies: marks([[8, 14], [17, 14], [26, 12]], 'supply'),
      switches: [wheel('port', 'Port winch', 7, 9, 'Connect the first and middle islands at the northern pier.'), wheel('starboard', 'Starboard winch', 16, 6, 'Connect the middle and final islands at the southern pier.')], requiredSwitches: ['port', 'starboard'],
      gates: [...span('port', [[10, 5], [11, 5]], { port: true }), ...span('starboard', [[20, 14], [21, 14]], { starboard: true }), p('regatta-signal', 24, 16, { type: 'signal' })],
      relays: [bell('shell', 'Shell bell', 4, 4), bell('wake', 'Wake bell', 15, 15), bell('gale', 'Gale bell', 26, 4)], sequence: ['shell', 'wake', 'gale'],
      npcs: [keeper('skiff', 'Skiff', 2, 10, ['“Six racing tokens drifted onto the three islands. We cannot begin without every one.”', '“Ring Shell, Wake, Gale. Port opens the north pier; Starboard opens the south pier. The finish enclosure follows the bells.”'])],
      hunters: [hunter('pier-marshal', [[7, 11], [7, 15]]), hunter('wake-chaser', [[16, 11], [18, 11]]), hunter('gale-chaser', [[25, 7], [27, 7]], { nemesisOnly: true })],
      cover: [...cover(4, 11), ...cover(14, 4), ...cover(17, 15), ...cover(25, 9)],
      intro: 'Recover six racing tokens across three islands, restore the course lamps, and ring the regatta’s opening tune.',
      hint: 'Sweep the first island before Port. Ring Shell, cross the northern pier, then ring Wake on the middle island. Starboard opens the southern pier to Gale and the final island.',
      ending: 'Skiff counts six tokens. The bells announce a lantern race across the newly lit islands.' },
    { ...base(21, 'The Last Lighthouse', light, { x: 3, y: 9 }, { x: 4, y: 4 }, 165), actFinal: true, nemesisStart: 18,
      subtitle: 'Finale · two keepers and the storm lens', tags: ['Convoy rescue', 'Watcher', 'Relic return'],
      lanterns: marks([[4, 7], [26, 4], [5, 19], [27, 19]], 'lamp'), keys: marks([[12, 4]], 'key'), coins: marks([[10, 3], [25, 7], [5, 21], [28, 14]], 'coin'),
      hearts: marks([[12, 9], [20, 20]], 'heart'), supplies: marks([[9, 8], [20, 16], [25, 20]], 'supply'),
      switches: [wheel('beam', 'Beam winch', 9, 7, 'Raise the western crossing until Harbour is on.'), wheel('harbour', 'Harbour winch', 22, 15, 'Raise the eastern return crossing and close the western one.'), wheel('breakwater', 'Breakwater pump', 10, 18, 'Cool the storm lanes south of the lighthouse.')], requiredSwitches: ['beam', 'harbour', 'breakwater'],
      gates: [...span('beam', [[7, 11], [7, 12]], { beam: true, harbour: false }), ...span('harbour', [[26, 11], [26, 12]], { harbour: true }), p('lens-key', 23, 18, { type: 'key' }), p('lighthouse-signal', 7, 4, { type: 'signal' })],
      relays: [bell('fog', 'Fog bell', 9, 4), bell('gull', 'Gull bell', 6, 17), bell('dawn', 'Dawn bell', 26, 17)], sequence: ['fog', 'gull', 'dawn'],
      relic: p('relic', 27, 20, { name: 'Storm lens' }), delivery: { x: 4, y: 4 }, requiredRescues: ['kelp', 'mara'],
      npcs: [keeper('tala', 'Tala', 2, 9, ['“Kelp is in the south lantern room. Mara waits on the north shore. Bring both keepers and the storm lens home.”', '“Fog, Gull, Dawn opens our haven. Beam takes you out; Harbour brings you back.”'], [choice('shelter', 'Ask Tala to cool the breakwater', '“I will turn the shore pump.” The storm lane is cooled.', { switches: { breakwater: true } }), choice('flares', 'Pack a storm kit instead', '“Find the south pump yourself.” Two echoes and a ward packed.', { decoys: 2, shields: 1 })]), keeper('kelp', 'Kelp', 28, 19, ['“Restore all four lamps, then I can bring the lens home with you.”'], [], '“The lantern room is safe. I will follow you.”'), keeper('mara', 'Mara', 21, 4, ['“Come back for me when every lamp is burning.”'], [], '“I can see the haven’s light. Let us go together.”')],
      hazards: heat([[18, 14], [19, 14], [20, 14], [21, 14]], 'breakwater'),
      hunters: [hunter('lighthouse-watcher', [[19, 17], [22, 17]], { boss: true, vision: 8 }), hunter('fog-reader', [[12, 7], [12, 10]]), hunter('storm-outrider', [[10, 20], [15, 20]], { nemesisOnly: true })],
      cover: [...cover(6, 7), ...cover(23, 5), ...cover(6, 19), ...cover(19, 19), ...cover(25, 17)],
      resultTitle: 'A light for every returning boat.', endingChoice: 'tala', epilogues: { shelter: 'Tala holds the breakwater while Kelp and Mara mount the storm lens. Every returning boat sees the haven.', flares: 'Your convoy carries the last echoes through the storm. Four lamps and the lens make a new dawn.' },
      intro: 'A four-lamp lighthouse rescue. Recover the storm lens, gather two keepers, and bring the convoy home while the Watcher changes phases.',
      hint: 'Find the north key and ring Fog before crossing with Beam. Ring Gull, cool Breakwater if needed, restore the south lights, ring Dawn, and rescue Kelp. Harbour opens the eastern return to Mara and the haven.' },
    { ...base(22, 'Clockvine Gardens', garden, { x: 3, y: 10 }, { x: 25, y: 15 }, 105), contractStart: true,
      subtitle: 'Two garden carts. Two hedge doors.', tags: ['Crate routes', 'Gardener choice'],
      lanterns: marks([[4, 3], [16, 15], [25, 4]], 'lamp'), coins: marks([[4, 16], [15, 3], [24, 16]], 'coin'), hearts: marks([[9, 9], [18, 13]], 'heart'), supplies: marks([[8, 16], [18, 16]], 'supply'),
      crates: [p('north-cart', 6, 6), p('south-cart', 6, 14)], plates: [p('north-stop', 7, 6), p('south-stop', 7, 14)],
      switches: [wheel('root', 'Root wheel', 16, 4, 'Open the eastern hedge door.')], requiredSwitches: ['root'],
      gates: [p('north-hedge', 11, 6, { type: 'bridge', plates: ['north-stop'] }), p('south-hedge', 11, 14, { type: 'bridge', plates: ['south-stop'] }), gate('east-hedge', 20, 10, { root: true })],
      npcs: [keeper('uma', 'Uma', 2, 10, ['“The gardens wake when both carts rest on their copper stops. Push each cart one step east.”', '“I can open Root for you, or pack a kit while you find its wheel in the middle garden.”'], [choice('root', 'Ask Uma to open Root', '“Take the shorter route through the middle beds.” Root opens.', { switches: { root: true } }), choice('kit', 'Find Root; take the gardener’s kit', '“Let the hunters chase fallen leaves.” Two decoys and a ward packed.', { decoys: 2, shields: 1 })])],
      hunters: [hunter('vine-listener', [[16, 9], [16, 13]]), hunter('orchard-guard', [[24, 8], [24, 12]]), hunter('night-gardener', [[8, 9], [8, 12]], { nemesisOnly: true })],
      cover: [...cover(5, 8), ...cover(14, 12), ...cover(23, 8)],
      intro: 'Wake the clockvine gardens by parking both carts, opening Root, and restoring lamps beyond two hedge walls.',
      hint: 'Stand west of each cart and push it one tile east onto its stop. Both stops must remain held at the finish. Uma can open Root, or you can use the wheel in the middle garden.',
      endingChoice: 'uma', epilogues: { root: 'Uma hears the hedge doors unfold. The garden welcomes its first visitors in a century.', kit: 'Fallen-leaf echoes distract the guards while you wake the Root wheel. The gardens begin to bloom.' } },
    { ...base(23, 'The Midnight Market', market, { x: 3, y: 11 }, { x: 26, y: 19 }, 205),
      subtitle: 'A walking clock with changing lanes', tags: ['No dashing', 'Every coin', 'Changing lanes'], restrictions: { noDash: true }, requireCoins: true,
      lanterns: marks([[5, 3], [25, 10], [6, 17]], 'lamp'), coins: marks([[4, 4], [25, 4], [12, 3], [4, 11], [26, 11], [5, 18], [14, 18], [26, 18]], 'coin'),
      hearts: marks([[10, 11], [19, 18]], 'heart'), supplies: marks([[9, 5], [25, 12], [10, 18]], 'supply'),
      switches: [wheel('minute', 'Minute wheel', 16, 11, 'Close the upper west door; open the upper east door.'), wheel('hour', 'Hour wheel', 16, 18, 'Close the lower east door; open the lower west door.')], requiredSwitches: ['minute', 'hour'],
      gates: [gate('upper-west', 8, 7, { minute: false }), gate('upper-east', 23, 7, { minute: true }), gate('lower-west', 8, 14, { hour: true }), gate('lower-east', 23, 14, { hour: false }), p('market-signal', 23, 18, { type: 'signal' })],
      relays: [bell('wind', 'Wind bell', 6, 10), bell('leaf', 'Leaf bell', 25, 3), bell('chime', 'Chime bell', 22, 17)], sequence: ['wind', 'leaf', 'chime'],
      npcs: [keeper('nox', 'Nox', 2, 11, ['“Walk softly. The night market opens only after Wind, Leaf, Chime, and every lost coin.”', '“Minute changes the upper pair of doors. Hour changes the lower pair. Both wheels must be on at closing time.”'], [choice('echoes', 'Take two paper leaves', '“A false rustle buys a little time.” Two decoys packed.', { decoys: 2 }), choice('ward', 'Take a clockwork ward', '“Do not let the hands catch you.” One shield packed.', { shields: 1 })])],
      hunters: [hunter('minute-listener', [[17, 9], [21, 9]], { vision: 5 }), hunter('upper-clerk', [[19, 4], [24, 4]], { vision: 5 }), hunter('night-broker', [[16, 17], [20, 17]], { nemesisOnly: true, vision: 5 })],
      cover: [...cover(4, 9), ...cover(9, 3), ...cover(24, 9), ...cover(8, 17)],
      intro: 'A quiet eight-coin circuit through a market whose four doors follow two clock wheels. Dash is disabled; take time to plan.',
      hint: 'Ring Wind, explore the upper stalls through the west door, and ring Leaf. Return to the middle before turning Minute. Use the lower east door, gather the southern coins, turn Hour, then ring Chime.',
      ending: 'Nox balances eight little accounts. The bells announce midnight, and the market finally rests.' },
    { ...base(24, 'The Orchard That Woke', orchard, { x: 3, y: 13 }, { x: 4, y: 21 }, 190), actFinal: true, nemesisStart: 21, optionalPlates: true,
      subtitle: 'Finale · carry the living clock home', tags: ['Optional cart crossing', 'Convoy', 'Four-note lock'],
      lanterns: marks([[5, 4], [11, 21], [29, 5], [29, 21]], 'lamp'), keys: marks([[12, 4]], 'key'), coins: marks([[5, 16], [12, 3], [22, 5], [30, 18], [12, 23]], 'coin'),
      hearts: marks([[12, 14], [24, 20]], 'heart'), supplies: marks([[12, 15], [22, 8], [27, 18]], 'supply'),
      crates: [p('north-cart', 7, 11), p('south-cart', 7, 16)], plates: [p('north-stop', 8, 11), p('south-stop', 8, 16)],
      switches: [wheel('spring', 'Spring wheel', 10, 12, 'Open the middle orchard door until Dusk is on.'), wheel('dusk', 'Dusk wheel', 22, 19, 'Close the middle door and open the lower route home.'), wheel('rain', 'Rain wheel', 21, 8, 'Cool the hot clockwork lane.')], requiredSwitches: ['spring', 'dusk', 'rain'],
      gates: [p('cart-shortcut', 16, 6, { type: 'bridge', plates: ['north-stop', 'south-stop'] }), gate('spring-door', 16, 13, { spring: true, dusk: false }), gate('dusk-door', 16, 21, { dusk: true }), p('orchard-key', 26, 6, { type: 'key' }), p('orchard-signal', 8, 21, { type: 'signal' })],
      relays: [bell('seed', 'Seed bell', 5, 5), bell('spring-song', 'Spring bell', 11, 20), bell('leaf', 'Leaf bell', 28, 4), bell('dawn', 'Dawn bell', 28, 20)], sequence: ['seed', 'spring-song', 'leaf', 'dawn'],
      relic: p('relic', 29, 7, { name: 'Living clock' }), delivery: { x: 4, y: 21 }, requiredRescues: ['orr', 'nell'],
      npcs: [keeper('uma', 'Uma', 2, 13, ['“Seed, Spring, Leaf, Dawn. Bring Nell, Orr, and the living clock back to the western haven.”', '“Spring opens the middle door; Dusk opens the lower way home. The two carts offer an optional northern crossing.”'], [choice('rain', 'Ask Uma to start the rain', '“I will cool the clockwork lane.” Rain is on.', { switches: { rain: true } }), choice('tools', 'Take tools; find the Rain wheel', '“Then choose your own way through.” Two decoys and a ward packed.', { decoys: 2, shields: 1 })]), keeper('orr', 'Orr', 27, 22, ['“I will follow you when all four lamps are burning.”'], [], '“The living clock is ticking again. I am coming home.”'), keeper('nell', 'Nell', 11, 23, ['“The orchard wakes when its last lamp shines. Come back for me then.”'], [], '“I hear the four bells. Let us bring the garden home.”')],
      hazards: heat([[21, 13], [22, 13], [23, 13], [24, 13], [25, 13]], 'rain'),
      hunters: [hunter('heartwinder', [[22, 12], [28, 12]], { boss: true, vision: 8 }), hunter('root-reader', [[12, 7], [12, 13]]), hunter('dusk-ranger', [[22, 21], [27, 21]], { nemesisOnly: true })],
      cover: [...cover(5, 11), ...cover(10, 17), ...cover(20, 6), ...cover(27, 10), ...cover(27, 19)],
      resultTitle: 'The garden remembers the morning.', endingChoice: 'uma', epilogues: { rain: 'Uma sends rain through the brass leaves. Nell and Orr carry the living clock into a garden full of morning.', tools: 'Your convoy follows the last paper leaves home. The living clock strikes dawn, and every clockvine begins to flower.' },
      intro: 'Wake the living clock and bring two keepers home. Four lamps, four bells, a changing return route, and an optional two-cart crossing surround the final Watcher.',
      hint: 'Ring Seed then Spring on the west bank, collect the key, and open Spring. Visit the eastern vault for Leaf, its lamp, and the clock. Restore the southeast lamp, ring Dawn, rescue Orr, and turn Dusk. Return for Nell and the haven.' },
  ];
}
