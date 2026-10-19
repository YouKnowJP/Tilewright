import { createDocument } from './model.mjs';
import { GUILD_KITS } from './adventure-tools.mjs';
export const GUILD_KEY = 'tilewright.guild.v1';
export const GUILD_IDS = Object.freeze(Array.from({ length: 8 }, (_, i) => `guild-${i + 1}`));
const cells = (values, prefix) => values.map(([x, y], i) => ({ id: `${prefix}-${i}`, x, y }));
const hunter = (id, points, extra = {}) => ({ id, route: points.map(([x, y]) => ({ x, y })), vision: 7, ...extra });
const stonePair = (id, name, a, b) => [{ id: `${id}-west`, name: `${name} west`, x: a[0], y: a[1], partner: `${id}-east` }, { id: `${id}-east`, name: `${name} east`, x: b[0], y: b[1], partner: `${id}-west` }];
const keeper = (id, name, x, y, lines, rescue = false) => ({ id, name, x, y, lines, choices: [], ...(rescue ? { after: '“I am ready. Let the waystones carry us home.”' } : {}) });
function paint(map, x, y, ground, detail = 0) { const i = y * map.width + x; map.layers[0].tiles[i] = ground; map.layers[1].tiles[i] = detail; }
function mapFor(name, width, height, floor) {
  const map = createDocument(name, width, height); map.layers[0].tiles.fill(floor);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (!x || !y || x === width - 1 || y === height - 1) paint(map, x, y, floor, floor === 6 ? 9 : 7);
    else if (x % 7 === 0 && y % 5 === 0) map.layers[1].tiles[y * width + x] = 10;
  }
  return map;
}
function wall(map, x, doors) { for (let y = 1; y < map.height - 1; y++) if (!doors.includes(y)) paint(map, x, y, 6, 9); }
function river(map, x, width = 2) { for (let y = 1; y < map.height - 1; y++) for (let i = 0; i < width; i++) paint(map, x + i, y, 3); }
const cover = (x, y) => [{ x, y }, { x: x + 1, y }, { x, y: y + 1 }, { x: x + 1, y: y + 1 }];
function job(number, name, theme, width, height, floor, kit, merits, extra) {
  return { id: `guild-${number}`, name, theme, map: mapFor(name, width, height, floor), start: { x: 3, y: 9 }, exit: { x: 3, y: 15 },
    par: 110, lanterns: [], keys: [], coins: [], hearts: [], supplies: [], crates: [], plates: [], gates: [], enemies: [], hunters: [], npcs: [], cover: [], hazards: [], switches: [], relays: [],
    guild: { kit, merits }, ...extra };
}
export function createGuildJobs(kit = 'bellrunner') {
  if (!GUILD_KITS.some(value => value.id === kit)) throw Error('Choose a known Guild specialist.');
  const jobs = [
    job(1, 'The Folded Orchard', 'woodland', 26, 18, 2, kit, ['clean', 'treasure', 'power'], {
      subtitle: 'Learn to fold a path', start: { x: 3, y: 9 }, exit: { x: 3, y: 15 }, par: 95,
      lanterns: cells([[5, 3], [21, 4], [22, 14]], 'lamp'), coins: cells([[5, 14], [9, 4], [19, 5], [23, 13]], 'coin'),
      hearts: cells([[9, 13], [20, 13]], 'heart'), supplies: cells([[8, 13], [20, 10]], 'supply'),
      waystones: stonePair('orchard', 'Orchard', [9, 9], [17, 9]),
      hunters: [hunter('orchard-listener', [[8, 6], [8, 12]]), hunter('east-listener', [[20, 8], [23, 8]]), hunter('night-picker', [[18, 4], [18, 14]], { nemesisOnly: true })],
      cover: [...cover(5, 6), ...cover(8, 12), ...cover(18, 5), ...cover(22, 12)],
      npcs: [keeper('mira', 'Mira', 2, 9, ['“Waystones fold the path, not the danger. Plan shows what waits at the other end.”', 'Travel uses one energy and one turn. Your specialist tool costs two energy and recharges after six turns. Try it for a commendation.'])],
      intro: 'Restore a divided orchard. Cross its paired waystones and test a specialist tool. Seek every treasure for an optional commendation.',
      hint: 'Light the west lamp, take the Orchard west stone, restore both eastern lamps, then return by Orchard east. Pulse interrupts nearby hunters; Veil lets you move away from their last lead.' }),
    job(2, 'The Borrowed Minute', 'forge', 28, 20, 6, kit, ['clean', 'treasure', 'travel'], {
      subtitle: 'A heist with two ways around the lock', exit: { x: 24, y: 16 }, par: 120,
      lanterns: cells([[4, 4], [23, 4], [24, 15]], 'lamp'), keys: cells([[9, 4]], 'key'), coins: cells([[5, 14], [10, 15], [21, 5], [24, 12]], 'coin'),
      hearts: cells([[10, 12], [22, 13]], 'heart'), supplies: cells([[10, 13], [21, 14]], 'supply'),
      waystones: [...stonePair('minute', 'Minute', [10, 6], [19, 6]), ...stonePair('hour', 'Hour', [10, 15], [19, 15])],
      gates: [{ id: 'minute-lock', type: 'key', x: 14, y: 10 }],
      relays: [{ id: 'tick', name: 'Tick bell', x: 6, y: 4 }, { id: 'tock', name: 'Tock bell', x: 23, y: 13 }], sequence: ['tick', 'tock'],
      hunters: [hunter('minute-hand', [[11, 8], [11, 14]]), hunter('hour-hand', [[22, 8], [25, 8]]), hunter('late-hand', [[18, 4], [18, 16]], { nemesisOnly: true })],
      cover: [...cover(5, 7), ...cover(10, 12), ...cover(18, 8), ...cover(23, 14)],
      npcs: [keeper('pip', 'Pip', 2, 9, ['“Tick, then Tock. You can use the key door, or cross by either waystone pair.”', 'Two crossings earn the Traveler commendation. The southern coin is easier to collect before you leave the west side.'])],
      intro: 'Steal a minute from a clockwork archive. Choose a key door or either of two waystone pairs; optional treasure and repeated crossings change your route.',
      hint: 'Ring Tick before crossing and Tock afterward. The west key opens the middle door; both waystone pairs bypass it. Two successful jumps earn the Traveler commendation.' }),
    job(3, 'Reedglass Evacuation', 'marsh', 28, 20, 2, kit, ['clean', 'power', 'swift'], {
      subtitle: 'Bring two voices through the reeds', par: 125,
      lanterns: cells([[5, 4], [23, 4], [24, 15]], 'lamp'), coins: cells([[6, 14], [20, 4], [24, 12]], 'coin'), hearts: cells([[9, 12], [21, 13]], 'heart'), supplies: cells([[9, 13], [21, 11]], 'supply'),
      waystones: stonePair('reed', 'Reedglass', [10, 9], [18, 9]),
      hunters: [hunter('reed-watcher', [[21, 9], [24, 9]], { boss: true }), hunter('bank-listener', [[8, 5], [8, 13]]), hunter('reed-ranger', [[20, 13], [24, 13]], { nemesisOnly: true })],
      cover: [...cover(5, 7), ...cover(9, 13), ...cover(19, 5), ...cover(23, 13)],
      npcs: [keeper('luma', 'Luma', 2, 9, ['“Light every lamp, then bring Jun and Sen through the Reedglass stone. There is no hidden deadline.”', 'A clean finish within the displayed star target earns Swift. Use your specialist tool at least once for Artifice.']), keeper('jun', 'Jun', 24, 5, ['“The reeds have swallowed the signal. I will follow when every lamp is lit.”'], true), keeper('sen', 'Sen', 24, 16, ['“Jun and I leave together. Bring all three lights back first.”'], true)], requiredRescues: ['jun', 'sen'],
      intro: 'Rescue two keepers across the reed river. A Watcher grows sharper as you restore lamps; your kit and the return crossing matter.',
      hint: 'Light the west lamp, jump east, restore the two eastern lamps, then speak to Jun and Sen. Carry the convoy back through Reedglass east and reach the southwest beacon.' }),
    job(4, 'The Hushed Folio', 'archive', 30, 22, 6, kit, ['clean', 'treasure', 'power'], {
      subtitle: 'Cargo breaks the veil', start: { x: 3, y: 11 }, exit: { x: 3, y: 18 }, par: 135,
      lanterns: cells([[5, 4], [25, 4], [25, 18]], 'lamp'), coins: cells([[5, 17], [11, 4], [22, 5], [26, 17]], 'coin'), hearts: cells([[11, 14], [23, 15]], 'heart'), supplies: cells([[11, 15], [21, 13]], 'supply'),
      waystones: stonePair('folio', 'Folio', [11, 11], [20, 11]),
      relic: { id: 'relic', name: 'Unhushed folio', x: 25, y: 6 }, delivery: { x: 3, y: 18 },
      relays: [{ id: 'ink', name: 'Ink bell', x: 8, y: 4 }, { id: 'echo', name: 'Echo bell', x: 25, y: 16 }], sequence: ['ink', 'echo'],
      hunters: [hunter('folio-reader', [[10, 7], [10, 16]]), hunter('folio-listener', [[23, 9], [26, 9]]), hunter('night-author', [[21, 4], [21, 18]], { nemesisOnly: true })],
      cover: [...cover(5, 8), ...cover(10, 16), ...cover(20, 6), ...cover(25, 14)],
      npcs: [keeper('ves', 'Ves', 2, 11, ['“Ink, then Echo. Bring the folio back through the stones.”', 'Mist cannot hide a carried folio: its song reveals you. Drop it to draw a hunter aside, then reclaim it. Pulse interrupts a nearby listener, but does not protect against contact.'])],
      intro: 'Carry a singing folio through a sealed archive. Gather treasure and choose when to use your tool; carrying cargo defeats the Mistweaver’s concealment.',
      hint: 'Restore the west lamp and ring Ink before jumping. Restore the eastern lamps, ring Echo, retrieve the folio, then jump home. Veil before carrying; pulse when hunters are close.' }),
    job(5, 'The Sandfold Exchange', 'dunes', 30, 22, 4, kit, ['clean', 'travel', 'swift'], {
      subtitle: 'Cool the road or take the long fold', start: { x: 3, y: 11 }, exit: { x: 26, y: 18 }, par: 130,
      lanterns: cells([[5, 4], [24, 4], [25, 17]], 'lamp'), coins: cells([[5, 17], [11, 4], [22, 5], [26, 15]], 'coin'), hearts: cells([[11, 12], [23, 16]], 'heart'), supplies: cells([[11, 14], [22, 13]], 'supply'),
      waystones: [...stonePair('sun', 'Sunfold', [10, 5], [20, 5]), ...stonePair('shade', 'Shadefold', [10, 17], [20, 17])],
      switches: [{ id: 'oasis', name: 'Oasis regulator', x: 22, y: 11, initial: false, description: 'Cool the eastern hot lane.' }], requiredSwitches: ['oasis'],
      hazards: [21, 22, 23, 24, 25].map(x => ({ x, y: 12, period: 5, phases: [2, 3], disabledBy: 'oasis' })),
      hunters: [hunter('sand-courier', [[11, 8], [11, 14]]), hunter('sun-taxman', [[23, 7], [26, 7]]), hunter('shade-taxman', [[23, 15], [26, 15]], { nemesisOnly: true })],
      cover: [...cover(5, 8), ...cover(10, 14), ...cover(19, 8), ...cover(25, 14)],
      npcs: [keeper('saff', 'Saff', 2, 11, ['“Two folds across the sand. Take a return trip for Traveler, but leave time to cool the Oasis regulator.”', 'You can finish with one crossing. Extra commendations are invitations, not exit locks.'])],
      intro: 'Reconnect a desert exchange. Two waystone pairs compete with a longer return route; restore the lamps and cool the oasis before departure.',
      hint: 'Light the west lamp, jump by Sunfold, collect the eastern lights, and cool Oasis. For Traveler, return west by Shadefold, then use a stone east again before finishing.' }),
    job(6, 'Aurora Dispatch', 'aurora', 32, 24, 2, kit, ['clean', 'treasure', 'power'], {
      subtitle: 'Two folds, one last signal', start: { x: 3, y: 12 }, exit: { x: 3, y: 20 }, par: 170,
      lanterns: cells([[5, 4], [10, 20], [27, 4], [28, 20]], 'lamp'), coins: cells([[5, 19], [10, 4], [24, 5], [29, 19]], 'coin'), hearts: cells([[11, 13], [24, 18]], 'heart'), supplies: cells([[11, 14], [23, 10], [27, 17]], 'supply'),
      waystones: [...stonePair('dawn', 'Dawnfold', [11, 6], [21, 6]), ...stonePair('dusk', 'Duskfold', [11, 18], [21, 18])],
      relic: { id: 'relic', name: 'Dispatch prism', x: 27, y: 6 }, delivery: { x: 3, y: 20 },
      relays: [{ id: 'root', name: 'Root bell', x: 6, y: 4 }, { id: 'snow', name: 'Snow bell', x: 10, y: 19 }, { id: 'star', name: 'Star bell', x: 26, y: 4 }], sequence: ['root', 'snow', 'star'],
      hunters: [hunter('dispatch-watcher', [[23, 12], [28, 12]], { boss: true }), hunter('frost-listener', [[10, 8], [10, 15]]), hunter('polar-guard', [[22, 16], [27, 16]], { nemesisOnly: true })],
      cover: [...cover(5, 9), ...cover(10, 15), ...cover(20, 8), ...cover(27, 18)],
      npcs: [keeper('elu', 'Elu', 2, 12, ['“Root, Snow, Star. Bring Tess and the dispatch prism back together.”', 'Dawnfold and Duskfold offer different escape routes. Read the destination forecast before spending your last energy.']), keeper('tess', 'Tess', 28, 7, ['“Four lamps, then I follow. We can carry the northern dispatch home.”'], true)], requiredRescues: ['tess'],
      intro: 'A Guild finale across a frozen divide. Restore four lights, three bells, and a keeper, then return with the singing dispatch through either fold.',
      hint: 'Restore the two west lamps, ring Root then Snow, and jump east. Restore the eastern lamps, ring Star, rescue Tess, and take the prism. Return through either waystone pair.' }),
    job(7, 'The Glasshouse Double', 'clockwork', 26, 18, 1, kit, ['clean', 'treasure', 'power'], {
      subtitle: 'One keeper. Two places.', par: 125, optionalPlates: true,
      lanterns: cells([[5, 3], [15, 5], [22, 14]], 'lamp'), coins: cells([[6, 3], [14, 5], [22, 12], [5, 14]], 'coin'),
      hearts: cells([[6, 12], [20, 13]], 'heart'), supplies: cells([[7, 12], [20, 12]], 'supply'),
      crates: cells([[9, 5]], 'crate'), plates: cells([[10, 5]], 'plate'),
      gates: [12, 13].map(x => ({ id: `glass-span-${x}`, type: 'bridge', x, y: 5, plates: ['plate-0'], safeClose: true })),
      waystones: stonePair('glass', 'Glasshouse', [8, 13], [18, 13]),
      relays: [{ id: 'glass', name: 'Glass bell', x: 6, y: 4 }, { id: 'glimmer', name: 'Glimmer bell', x: 22, y: 11 }], sequence: ['glass', 'glimmer'],
      hunters: [hunter('glass-listener', [[20, 8], [23, 8]], { vision: 6 }), hunter('night-glazier', [[20, 14], [23, 14]], { nemesisOnly: true, vision: 6 })],
      cover: [...cover(16, 7), ...cover(21, 12)],
      npcs: [{ ...keeper('ivo', 'Ivo', 2, 9, ['“A double can hold the copper plate while you cross. Its six small lights count the turns you have left.”', '“B casts it; B again returns you for one energy. It cannot carry treasure for you. A crate holds the bridge for as long as you leave it there.”']), choices: [
        { id: 'shield', label: 'Take a spare shield', response: '“For the committed move you cannot lure away.”', effect: { shields: 1 } },
        { id: 'decoys', label: 'Take two false lanterns', response: '“A false lantern can draw a hunter away from your return point.”', effect: { decoys: 2 } },
      ] }],
      intro: 'An abandoned glasshouse has two ways across its canal. Hold the northern plate with a crate or your double, or take the southern waystone. Light three lamps and ring Glass before Glimmer.',
      hint: 'The northern plate is at column 11, row 6. Push its crate east, or step around the crate and cast a double on the plate. Cross to the nearby lamp; return before its six lights fade. Occupied bridge cells stay open until clear. The southern waystone always offers another route.' }),
    job(8, 'The Borrowed Horizon', 'coast', 30, 22, 4, kit, ['clean', 'power', 'travel'], {
      subtitle: 'Leave a light. Bring a life home.', start: { x: 3, y: 11 }, exit: { x: 3, y: 18 }, par: 180, optionalPlates: true,
      lanterns: cells([[5, 4], [10, 18], [26, 4], [26, 18]], 'lamp'), coins: cells([[6, 17], [12, 4], [24, 5], [27, 17]], 'coin'),
      hearts: cells([[11, 13], [24, 16]], 'heart'), supplies: cells([[11, 14], [22, 10], [27, 15]], 'supply'),
      crates: cells([[11, 6]], 'crate'), plates: cells([[12, 6]], 'plate'),
      keys: cells([[12, 4]], 'key'),
      gates: [...[14, 15].map(x => ({ id: `horizon-span-${x}`, type: 'bridge', x, y: 6, plates: ['plate-0'], safeClose: true })), { id: 'memory-lock', type: 'key', x: 24, y: 5 }],
      waystones: [...stonePair('mirror', 'Mirror', [10, 5], [20, 5]), ...stonePair('shore', 'Shore', [10, 17], [20, 17])],
      switches: [{ id: 'rain', name: 'Rain condenser', x: 23, y: 11, initial: false, description: 'Cool the eastern ember lane.' }], requiredSwitches: ['rain'],
      hazards: [21, 22, 23, 24, 25, 26, 27].map(x => ({ x, y: 12, period: 5, phases: [2, 3], disabledBy: 'rain' })),
      relic: { id: 'relic', name: 'Memory lens', x: 26, y: 6 }, delivery: { x: 3, y: 18 },
      relays: [{ id: 'mirror', name: 'Mirror bell', x: 6, y: 4 }, { id: 'tide', name: 'Tide bell', x: 25, y: 4 }, { id: 'home', name: 'Home bell', x: 25, y: 17 }], sequence: ['mirror', 'tide', 'home'],
      hunters: [hunter('horizon-watcher', [[23, 9], [27, 9]], { boss: true, vision: 6 }), hunter('shore-listener', [[22, 15], [26, 15]], { nemesisOnly: true, vision: 6 })],
      cover: [...cover(18, 7), ...cover(24, 14), ...cover(26, 16)],
      npcs: [{ ...keeper('ivo', 'Ivo', 2, 11, ['“Neri and the memory lens are across the water. Mirror, Tide, Home: ring the bells in that order.”', '“I can cool the ember lane from here, or send supplies so you can reach the condenser yourself. Your double draws hunters, but cannot erase their next move.”']), choices: [
        { id: 'cool', label: 'Ask Ivo to cool the eastern lane', response: '“The rain is yours. The road is still watched.”', effect: { switches: { rain: true } } },
        { id: 'kit', label: 'Take supplies and operate Rain yourself', response: '“A shield and two lanterns. Find the Rain condenser before crossing the embers.”', effect: { shields: 1, decoys: 2 } },
      ] }, keeper('neri', 'Neri', 27, 7, ['“Restore all four lamps and I will follow. Take the lens too; these memories belong on the other shore.”'], true)], requiredRescues: ['neri'],
      intro: 'Recover a memory lens and rescue Neri across a watched coast. Choose Ivo’s remote rain or extra supplies, ring Mirror → Tide → Home, and plan a safe return through either waystone or the plate bridge.',
      hint: 'Restore both western lamps, ring Mirror, and collect the west key before crossing east. Unlock the lighthouse at column 25, row 6. Ring Tide, restore the eastern lamps, cool Rain if needed, and ring Home. Return to Neri and pick up the lens. Two waystone jumps earn Traveler; a northern crate or double can hold an alternate crossing.' }),
  ];
  river(jobs[0].map, 12); wall(jobs[1].map, 14, [10]); river(jobs[2].map, 13); wall(jobs[3].map, 15, []); river(jobs[4].map, 14); river(jobs[5].map, 15, 3);
  river(jobs[6].map, 12); river(jobs[7].map, 14);
  for (let y = 2; y <= 8; y++) for (let x = 24; x <= 28; x++) if (y === 2 || y === 8 || x === 24 || x === 28) paint(jobs[7].map, x, y, 6, 9);
  paint(jobs[7].map, 24, 5, 6);
  for (const stage of jobs) {
    for (const p of [stage.start, stage.exit, ...stage.lanterns, ...stage.keys, ...stage.coins, ...stage.hearts, ...stage.supplies, ...stage.waystones, ...stage.npcs, ...stage.relays, ...stage.switches, ...stage.cover, ...(stage.relic ? [stage.relic] : [])]) stage.map.layers[1].tiles[p.y * stage.map.width + p.x] = 0;
  }
  return jobs;
}

export const MERITS = Object.freeze({ clean: 'Take no damage', treasure: 'Find every treasure', power: 'Use your specialist tool', travel: 'Make at least two waystone jumps', swift: 'Finish within the star turn target' });
export function guildMerits(run) {
  if (!run.guild) return [];
  const won = run.status === 'won', target = Math.max(8, Math.floor(run.stage.par * (run.difficulty === 'nemesis' ? .85 : 1)));
  const done = { clean: won && run.damage === 0, treasure: run.collectedCoins.length === run.stage.coins.length, power: run.guild.uses > 0, travel: run.guild.warps >= 2, swift: won && run.turns <= target };
  return run.stage.guild.merits.map(id => ({ id, label: MERITS[id], done: done[id] }));
}
export const guildRecordId = run => `${run.stage.id}-${run.guild.kit}-${run.difficulty}`;
const validRecordId = id => GUILD_IDS.some(job => GUILD_KITS.some(kit => ['trail', 'nemesis'].some(rules => id === `${job}-${kit.id}-${rules}`)));
export function loadGuild(storage) {
  try {
    const text = storage.getItem(GUILD_KEY); if (!text || text.length > 16000) return {};
    const value = JSON.parse(text); if (value.version !== 1 || !value.records || typeof value.records !== 'object' || Array.isArray(value.records)) return {};
    return Object.fromEntries(Object.entries(value.records).filter(([id, record]) => validRecordId(id) && record && Number.isInteger(record.merits) && record.merits >= 0 && record.merits <= 3
      && Number.isInteger(record.turns) && record.turns >= 1 && record.turns <= 1000000 && Number.isInteger(record.score) && record.score >= 0 && record.score <= 1000000000).map(([id, record]) => [id, { merits: record.merits, turns: record.turns, score: record.score }]));
  } catch { return {}; }
}
export function saveGuild(storage, records, run, score) {
  if (run.status !== 'won' || !run.guild || !validRecordId(guildRecordId(run))) throw Error('Finish a valid Guild job before recording a result.');
  const id = guildRecordId(run), merits = guildMerits(run).filter(merit => merit.done).length, result = { merits, turns: run.turns, score: score + merits * 150 }, old = records[id];
  const improved = !old || result.merits > old.merits || (result.merits === old.merits && (result.score > old.score || (result.score === old.score && result.turns < old.turns)));
  const next = { ...records, [id]: improved ? result : old };
  try { storage.setItem(GUILD_KEY, JSON.stringify({ version: 1, records: next })); return { records: next, saved: true }; }
  catch { return { records: next, saved: false }; }
}
