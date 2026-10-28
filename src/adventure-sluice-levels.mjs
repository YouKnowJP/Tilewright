import { createDocument } from './model.mjs';
const points = (values, prefix) => values.map(([x, y], index) => ({ id: `${prefix}-${index}`, x, y }));
const person = (id, name, x, y, lines, choices = [], after) => ({ id, name, x, y, lines, choices, after });
const tracker = (id, route, extra = {}) => ({ id, route: route.map(([x, y]) => ({ x, y })), vision: 8, ...extra });
const control = (id, on = true) => ({ id, on });
const valve = (id, name, x, y, description, initial = false) => ({ id, name, x, y, description, initial });
const fire = (x, y, disabledBy, offset = 0) => ({ x, y, period: 4, phases: [2, 3], offset, disabledBy });
const cover = (x, y) => [{ x, y }, { x: x + 1, y }, { x, y: y + 1 }, { x: x + 1, y: y + 1 }];
function paint(map, x, y, ground = 5, detail = 0) { const index = y * map.width + x; map.layers[0].tiles[index] = ground; map.layers[1].tiles[index] = detail; }
function world(width, height, name, floor = 2) {
  const map = createDocument(name, width, height);
  map.layers[0].tiles.fill(floor);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (!x || !y || x === width - 1 || y === height - 1) paint(map, x, y, floor, floor === 6 ? 9 : 7);
    else if ((x * 13 + y * 17) % 29 === 0) map.layers[1].tiles[y * width + x] = 10;
  }
  return map;
}
function frame(map, left, top, right, bottom, door) {
  for (let y = top; y <= bottom; y++) { paint(map, left, y, 6, 9); paint(map, right, y, 6, 9); }
  for (let x = left; x <= right; x++) { paint(map, x, top, 6, 9); paint(map, x, bottom, 6, 9); }
  paint(map, door.x, door.y, 6);
}
function crossing(prefix, xs, y, controls) { return xs.map(x => ({ id: `${prefix}-${x}`, x, y, type: 'switch', appearance: 'sluice', controls })); }
const choice = (id, label, response, effect, cost) => ({ id, label, response, effect, ...(cost === undefined ? {} : { cost }) });

export function createSluiceSaga() {
  const rain = world(28, 20, 'Rainmoss Sluice');
  for (let y = 1; y < 19; y++) for (let x = 11; x <= 13; x++) paint(rain, x, y, 3);
  for (let y = 8; y <= 9; y++) for (let x = 5; x <= 8; x++) paint(rain, x, y, 2, 7);
  for (let y = 4; y <= 7; y++) for (let x = 18; x <= 19; x++) paint(rain, x, y, 2, 7);
  const glass = world(30, 22, 'Glasshouse Concord', 6);
  for (let y = 1; y < 21; y++) paint(glass, 15, y, 6, 9);
  for (const y of [6, 11, 16]) paint(glass, 15, y, 6);
  frame(glass, 22, 15, 28, 20, { x: 22, y: 18 });
  for (let y = 6; y <= 8; y++) for (let x = 7; x <= 9; x++) paint(glass, x, y, 6, 9);
  for (let y = 14; y <= 16; y++) for (let x = 20; x <= 21; x++) paint(glass, x, y, 6, 9);
  const ferry = world(34, 24, 'The Last Ferry');
  for (let y = 1; y < 23; y++) for (let x = 16; x <= 18; x++) paint(ferry, x, y, 3);
  frame(ferry, 25, 3, 32, 10, { x: 25, y: 7 });
  frame(ferry, 2, 17, 7, 22, { x: 7, y: 19 });
  for (let y = 8; y <= 10; y++) for (let x = 8; x <= 10; x++) paint(ferry, x, y, 2, 7);
  for (let y = 8; y <= 9; y++) for (let x = 21; x <= 23; x++) paint(ferry, x, y, 6, 9);
  return [
    { id: 'trail-7', name: 'Rainmoss Sluice', subtitle: 'New act · change the crossings', contractStart: true, map: rain,
      start: { x: 3, y: 10 }, exit: { x: 3, y: 16 }, par: 95,
      lanterns: points([[5, 3], [23, 4], [22, 16]], 'lantern'), keys: [], coins: points([[4, 5], [9, 15], [21, 3], [24, 15]], 'coin'),
      hearts: points([[8, 6], [23, 13]], 'heart'), supplies: points([[8, 15], [23, 11]], 'supply'), crates: [], plates: [], enemies: [],
      switches: [valve('intake', 'North intake', 7, 5, 'Open the north crossing until the spillway is powered.'),
        valve('spillway', 'South spillway', 20, 14, 'Open the south crossing and cool the east-bank embers. The north crossing closes.'),
        { ...valve('reed', 'Reed ferry', 8, 10, 'An optional middle crossing, operated by Luma’s route choice.'), operable: false }],
      requiredSwitches: ['intake', 'spillway'],
      gates: [...crossing('north', [11, 12, 13], 5, [control('intake'), control('spillway', false)]),
        ...crossing('south', [11, 12, 13], 14, [control('spillway')]), ...crossing('reed', [11, 12, 13], 10, [control('reed')])],
      hunters: [tracker('reed-stalker', [[9, 10], [9, 15]]), tracker('sluice-guard', [[20, 10], [24, 10]]), tracker('rain-ranger', [[22, 5], [22, 12]], { nemesisOnly: true })],
      hazards: [20, 21, 22, 23].map(x => fire(x, 10, 'spillway')),
      cover: [...cover(5, 7), ...cover(8, 12), ...cover(18, 6), ...cover(23, 14)],
      npcs: [person('luma', 'Luma', 2, 10, ['“The river remembers which doors we open. Help me restore both pumps, then bring the lamps home.”',
        'North intake opens the upper crossing. South spillway opens the lower crossing, closes the upper one, and cools the embers. You can reverse either wheel.'], [
        choice('ferry', 'Open the quieter reed ferry', '“The middle crossing is yours. The pumps still need you.” The reed ferry opens; your supplies stay as they are.', { switches: { reed: true } }),
        choice('supplies', 'Take supplies and use the sluices', '“Then read the water before you cross.” One decoy and one shield packed; restore both pumps for the return.', { decoys: 1, shields: 1 }),
      ])],
      resultTitle: 'The river has a way home.', endingChoice: 'luma',
      epilogues: { ferry: 'Luma keeps the reed ferry running for the next travelers. Your quiet shortcut becomes a shared route.', supplies: 'The keepers reopen the restored sluices. Luma saves your route in the trail journal.' },
      intro: 'Restore two pumps and three lights, then return home. Luma can open a quieter middle route or equip you for the sluice crossings.',
      hint: 'North intake is on the west bank. Cross north, find the eastern lamps, then activate South spillway for a safe southern return. Both pumps must be on at the finish.' },
    { id: 'trail-8', name: 'Glasshouse Concord', subtitle: 'Switch puzzle · a trail-coin bargain', map: glass,
      start: { x: 3, y: 11 }, exit: { x: 26, y: 18 }, par: 110,
      lanterns: points([[4, 4], [25, 5], [25, 17]], 'lantern'), keys: [], coins: points([[5, 9], [5, 13], [10, 10], [23, 7], [26, 16]], 'coin'),
      hearts: points([[12, 11], [23, 13]], 'heart'), supplies: points([[12, 17], [20, 12]], 'supply'), crates: [], plates: [], enemies: [],
      switches: [valve('glass', 'Glass shutter', 6, 5, 'Glass alone opens the north arch; both shutters together open the middle arch.'),
        valve('moss', 'Moss shutter', 10, 16, 'Moss alone opens the south arch; both shutters together open the middle arch.'),
        valve('vent', 'Cooling vent', 22, 6, 'Turn off the eastern ember beds before ringing the far bell.')], requiredSwitches: ['vent'],
      gates: [{ id: 'north-arch', type: 'switch', x: 15, y: 6, controls: [control('glass'), control('moss', false)] },
        { id: 'middle-arch', type: 'switch', x: 15, y: 11, controls: [control('glass'), control('moss')] },
        { id: 'south-arch', type: 'switch', x: 15, y: 16, controls: [control('moss'), control('glass', false)] },
        { id: 'glass-signal', type: 'signal', x: 22, y: 18 }],
      relays: [{ id: 'dew', name: 'Dew bell', x: 9, y: 4 }, { id: 'sun', name: 'Sun bell', x: 25, y: 8 }], sequence: ['dew', 'sun'],
      hunters: [tracker('glass-listener', [[10, 11], [10, 7]]), tracker('garden-guard', [[23, 11], [26, 11]]), tracker('fern-guard', [[20, 4], [20, 14]], { nemesisOnly: true })],
      hazards: [...[22, 23, 24, 25].map(x => fire(x, 10, 'vent')), ...[6, 7, 8].map(y => fire(24, y, 'vent', 1))],
      cover: [...cover(5, 7), ...cover(11, 13), ...cover(19, 7), ...cover(25, 12)],
      npcs: [person('sen', 'Sen', 2, 11, ['“The shutters have three answers: Glass only, Moss only, or both. Each opens a different arch.”',
        'Ring Dew, then Sun. The cooling vent must be on before we leave. Rook trades supplies for coins, but you can finish without buying anything.']),
        person('rook', 'Rook', 7, 11, ['“Two coins for a pair of decoys, or one coin for a shield. Choose once; I have only one parcel left.”', 'Collected treasure still counts toward your quest. Only unspent coins can buy supplies.'], [
          choice('decoys', 'Trade 2 coins for 2 decoys', '“Make two false stories, then take the third path.” Two decoys packed.', { decoys: 2 }, 2),
          choice('shield', 'Trade 1 coin for 1 shield', '“For the glass crossing.” One shield packed.', { shields: 1 }, 1),
        ])],
      resultTitle: 'The glasshouse answers.', endingChoice: 'rook', ending: 'Sen opens the garden for the keepers. Rook saves the unclaimed parcel for another traveler.',
      epilogues: { decoys: 'Rook listens for your two false stories. The garden bells carry a third: everyone has a path home.', shield: 'Rook sees the shield safely through the crossing. Sen lets the cool air back into the garden.' },
      intro: 'Reconfigure the glasshouse arches, cool its ember beds, and ring Dew then Sun. Gather coins if you want to bargain with Rook.',
      hint: 'Glass shutter is northwest; Moss shutter is southwest. Both on opens the middle arch. Ring Dew before crossing, activate the eastern Cooling vent, then ring Sun.' },
    { id: 'trail-9', name: 'The Last Ferry', subtitle: 'Finale · two keepers and a singing relic', actFinal: true, nemesisStart: 6, map: ferry,
      start: { x: 3, y: 12 }, exit: { x: 4, y: 19 }, par: 185,
      lanterns: points([[5, 5], [29, 5], [28, 19]], 'lantern'), keys: points([[11, 4]], 'key'),
      coins: points([[6, 7], [12, 18], [22, 4], [30, 12], [30, 21]], 'coin'), hearts: points([[13, 13], [23, 17]], 'heart'),
      supplies: points([[12, 13], [22, 11], [29, 16]], 'supply'), crates: [], plates: [], enemies: [],
      switches: [valve('moor', 'Mooring wheel', 20, 12, 'Raise the north ferry and lower the south ferry. Leave it on for departure.'),
        valve('shade', 'Storm shelter', 12, 12, 'Cool the eastern storm lanes. Iona can activate it while you prepare.')], requiredSwitches: ['moor'],
      gates: [...crossing('north-ferry', [16, 17, 18], 7, [control('moor')]), ...crossing('south-ferry', [16, 17, 18], 16, [control('moor', false)]),
        { id: 'ferry-key', type: 'key', x: 25, y: 7 }, { id: 'ferry-signal', type: 'signal', x: 7, y: 19 }],
      relays: [{ id: 'root', name: 'Root bell', x: 8, y: 18 }, { id: 'tide', name: 'Tide bell', x: 23, y: 5 }], sequence: ['root', 'tide'],
      relic: { id: 'relic', name: 'Ferry songstone', x: 29, y: 7 }, delivery: { x: 4, y: 19 },
      hunters: [tracker('ferry-watcher', [[23, 12], [29, 12]], { boss: true }), tracker('shore-hunter', [[12, 10], [12, 15]]), tracker('storm-ranger', [[22, 16], [26, 16]], { nemesisOnly: true })],
      hazards: [...[21, 22, 23, 24, 25].map(x => fire(x, 12, 'shade')), ...[26, 27, 28, 29].map(x => fire(x, 14, 'shade', 1))],
      cover: [...cover(7, 9), ...cover(12, 15), ...cover(20, 8), ...cover(27, 16)],
      npcs: [person('iona', 'Iona', 2, 12, ['“One last crossing. Bring back Jun, Sola, and the ferry songstone. We all leave together.”',
        'Ring Root then Tide. Cross south first; the eastern Mooring wheel opens the north ferry. Rescue both keepers after restoring all lamps.'], [
          choice('shelter', 'Ask Iona to quiet the storm lanes', '“I will hold the shelter open.” Eastern ember lanes are cooled. You keep your current loadout.', { switches: { shade: true } }),
          choice('prepare', 'Take a heart and an extra decoy', '“Then make the storm chase your echo.” One heart restored and a decoy packed. Storm shelter can still be turned on at its wheel.', { health: 1, decoys: 1 }),
        ]),
        person('jun', 'Jun', 30, 8, ['“The songstone can guide the ferry, but its noise draws the Watcher. Light every lamp and come back for me.”'], [], '“I am with you. Set the stone down if we need a false trail.”'),
        person('sola', 'Sola', 29, 20, ['“I will wait here until every lamp is lit. Do not leave Jun in the vault.”'], [], '“Nobody left behind. The north ferry is our way home.”')],
      requiredRescues: ['jun', 'sola'],
      resultTitle: 'Nobody misses the last ferry.', endingChoice: 'iona',
      epilogues: { shelter: 'Iona releases the storm shelter after Jun and Sola board. The songstone sings for all three keepers.', prepare: 'The echoes fade behind the ferry. Iona hears Jun and Sola laughing over the songstone: everyone came home.' },
      intro: 'Restore the lamps, rescue Jun and Sola, and deliver the songstone home. Change the ferry route while a three-phase Watcher learns your steps.',
      hint: 'Take the west-bank key and ring Root before crossing south. Activate Mooring wheel, ring Tide, restore the lamps, retrieve the stone, and speak to both keepers. Return by the north ferry.' },
  ];
}
