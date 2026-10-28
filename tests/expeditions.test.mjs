import test from 'node:test';
import assert from 'node:assert/strict';
import { createDocument } from '../src/model.mjs';
import { createRun, stepRun, canEnter, nearbyInteractions, walkableCells } from '../src/adventure.mjs';
import { PERKS, VOWS, perkEffects } from '../src/adventure-perks.mjs';
import { generateStage, expeditionConfig, dailySeed, normalizeSeed, randomFor, FAMILIES, BIOMES } from '../src/adventure-generator.mjs';
import { createJourney, advanceJourney, retryLeg, serializeJourney, restoreJourney, saveJourney, loadJourney, peekJourney, MAX_JOURNAL, JOURNEY_KEY } from '../src/adventure-journey.mjs';
import { emptyLogbook, creditJourney, loadLogbook, saveLogbook, LOGBOOK_KEY } from '../src/adventure-logbook.mjs';
const p = (x, y, id = 'item') => ({ x, y, id });
const definition = (overrides = {}) => ({ id: 'test', name: 'Test', par: 40, map: createDocument('Test', 12, 8), start: p(1, 2), exit: p(10, 6), lanterns: [p(10, 1, 'light')], ...overrides });
const store = () => { const values = new Map([['tilewright.document.v1', 'keep-map'], ['tilewright.adventures.v1', 'keep-bests'], ['tilewright.tactics.v1', 'keep-memory']]); return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; };
function reachable(stage, open) {
  const cells = walkableCells(stage.map), blocked = new Set([...stage.npcs, ...(!open ? stage.gates : [])].map(p => p.y * stage.map.width + p.x));
  const start = stage.start.y * stage.map.width + stage.start.x, found = new Set([start]), queue = [stage.start];
  for (const point of queue) for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
    const x = point.x + dx, y = point.y + dy, index = y * stage.map.width + x;
    if (x < 0 || y < 0 || x >= stage.map.width || y >= stage.map.height || !cells[index] || blocked.has(index) || found.has(index)) continue;
    found.add(index); queue.push({ x, y });
  }
  return point => found.has(point.y * stage.map.width + point.x);
}

test('seeds, daily dates, modes, lengths, oaths, and rules are normalized and bounded', () => {
  assert.equal(normalizeSeed('  My  Trail  '), 'my-trail'); assert.equal(dailySeed(new Date('2026-10-18T01:00:00Z')), 'daily-2026-10-18');
  assert.equal(expeditionConfig({ mode: 'contract', length: 9 }).length, 1);
  assert.deepEqual(expeditionConfig({ mode: 'daily', seed: 'daily-2026-10-18', difficulty: 'nemesis', vow: 'quiet' }), { mode: 'daily', seed: 'daily-2026-10-18', length: 5, difficulty: 'trail', vow: 'none' });
  for (const value of ['', '<script>', 'a'.repeat(33), '../save', 123]) assert.throws(() => normalizeSeed(value));
  for (const value of [{ mode: 'unknown' }, { length: 2 }, { vow: 'anything' }, { difficulty: 'anything' }, { mode: 'daily', seed: 'not-a-date' }, { mode: 'daily', seed: 'daily-2026-02-30' }, { mode: 'daily', seed: 'daily-2026-13-01' }]) assert.throws(() => expeditionConfig(value));
  assert.throws(() => dailySeed(new Date('invalid')));
});

test('generated maps are deterministic and 2,304 seed/leg/branch variants keep every prerequisite and objective reachable', () => {
  const families = new Set(), biomes = new Set();
  assert.deepEqual(generateStage({ seed: 'repeat' }), generateStage({ seed: 'repeat' }));
  assert.notDeepEqual(generateStage({ seed: 'one' }).map.layers, generateStage({ seed: 'two' }).map.layers);
  for (let seed = 0; seed < 128; seed++) for (let leg = 0; leg < 9; leg++) for (const branch of ['s', 'b']) {
    const stage = generateStage({ seed: `qa-${seed}`, length: 9, difficulty: seed % 2 ? 'trail' : 'nemesis', vow: VOWS[seed % VOWS.length].id }, leg, 's'.repeat(leg) + branch);
    const before = reachable(stage, false), after = reachable(stage, true);
    families.add(stage.expedition.family); biomes.add(stage.expedition.biome);
    for (const point of [...stage.keys, ...stage.relays]) assert.ok(before(point), `${stage.id} has an unreachable prerequisite.`);
    for (const point of [...stage.lanterns, ...stage.coins, ...stage.hearts, ...stage.supplies, stage.exit, ...(stage.relic ? [stage.relic, stage.delivery] : [])]) assert.ok(after(point), `${stage.id} has an unreachable objective.`);
    for (const npc of stage.npcs) assert.ok([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => after({ x: npc.x + dx, y: npc.y + dy })), 'A keeper must be approachable.');
    assert.equal(new Set([...stage.lanterns, ...stage.keys, ...stage.relays, ...stage.coins].map(point => `${point.x},${point.y}`)).size, stage.lanterns.length + stage.keys.length + stage.relays.length + stage.coins.length);
    assert.ok(stage.map.width <= 32 && stage.map.height <= 22);
  }
  assert.equal(families.size, FAMILIES.length); assert.equal(biomes.size, BIOMES.length);
});

test('each camp branch previews its actual biome, mission, bounty, and hunter count', async () => {
  const { routeChoices } = await import('../src/adventure-generator.mjs');
  const config = expeditionConfig({ seed: 'routes', length: 9, difficulty: 'nemesis' });
  for (let leg = 1; leg < 9; leg++) for (const choice of routeChoices(config, leg, 's'.repeat(leg))) {
    const stage = generateStage(config, leg, choice.path), run = createRun(stage, { difficulty: config.difficulty });
    assert.equal(stage.expedition.biome, choice.biome.id); assert.equal(stage.expedition.family, choice.family.id);
    assert.equal(stage.expedition.bounty, choice.bounty); assert.equal(run.hunters.length, choice.hunters);
  }
});

test('courier relics can be carried, dropped as audible distractions, reclaimed, and delivered only with the remaining objectives', () => {
  const stage = definition({ relic: { ...p(2, 2, 'relic'), name: 'Relic' }, delivery: p(1, 3), lanterns: [p(6, 2, 'light')],
    hunters: [{ id: 'hunter', route: [p(6, 4), p(7, 4)], vision: 6 }] });
  const initial = createRun(stage); const carried = stepRun(initial, 'interact:relic');
  assert.equal(carried.carrying, true); assert.equal(carried.noise, 2); assert.equal(carried.turns, 1);
  const drop = stepRun(carried, 'drop-cargo'); assert.equal(drop.carrying, false); assert.deepEqual(drop.cargoPoint, { ...carried.player });
  assert.equal(drop.noise, 0); const listening = stepRun(drop, 'wait');
  assert.equal(listening.hunters[0].mode, 'following relic');
  const picked = stepRun(listening, 'interact:relic'); assert.equal(picked.carrying, true);
  const delivered = stepRun(picked, 'down'); assert.equal(delivered.cargoDelivered, true); assert.equal(delivered.carrying, false); assert.equal(delivered.status, 'playing');
  assert.equal(initial.cargoDelivered, false); assert.equal(initial.cargoPoint.x, 2);
  assert.equal(stepRun(delivered, 'drop-cargo'), delivered);
});

test('all eight camp upgrades have their advertised mechanical effects and respect resource caps', () => {
  assert.equal(PERKS.filter(perk=>!perk.kit).length, 8); assert.throws(() => perkEffects(['unknown'])); assert.throws(() => perkEffects(['quiet', 'quiet']));
  const quiet = stepRun(createRun(definition(), { perks: ['quiet'] }), 'dash-right'); assert.equal(quiet.noise, 1);
  const charge = createRun(definition(), { perks: ['charge'] }); assert.equal(stepRun({ ...charge, energy: 0 }, 'wait').energy, 2);
  const ward = stepRun(createRun(definition(), { perks: ['ward'] }), 'shield'); assert.equal(ward.ward, 4);
  const nectar = createRun(definition({ lanterns: [p(2, 2, 'light')] }), { perks: ['forager'] }); assert.equal(stepRun({ ...nectar, health: 1 }, 'right').health, 2);
  const pockets = createRun(definition(), { perks: ['provision'], loadout: { health: 3, decoys: 3, shields: 2 } }); assert.equal(pockets.decoys, 3); assert.equal(pockets.shields, 3);
  const normal = createRun(definition()), scout = createRun(definition(), { perks: ['scout'] }); assert.ok(scout.seen.filter(Boolean).length > normal.seen.filter(Boolean).length);
  const tough = createRun(definition({ enemies: [{ id: 'warden', route: [p(2, 2), p(3, 2)] }] }), { perks: ['sturdy'] }); assert.equal(stepRun(tough, 'right').invulnerability, 3);
  const echo = stepRun(createRun(definition(), { perks: ['decoy'] }), 'decoy'); assert.equal(echo.lure.until - echo.turns, 7);
  assert.throws(() => createRun(definition(), { loadout: { health: 0, decoys: 1, shields: 1 } }));
});

test('oaths block their prohibited actions without spending a turn, while treasure is a real exit requirement', () => {
  const quiet = createRun(definition({ restrictions: { noDash: true } })); assert.equal(stepRun(quiet, 'dash-right').turns, 0); assert.equal(stepRun(quiet, 'dash-right').energy, 3);
  const unwarded = createRun(definition({ restrictions: { noShield: true } })); assert.equal(stepRun(unwarded, 'shield').turns, 0); assert.equal(stepRun(unwarded, 'shield').shields, 2);
  const treasure = createRun(definition({ exit: p(2, 2), lanterns: [p(2, 2, 'light')], coins: [p(3, 2, 'coin')], requireCoins: true }));
  const unfinished = stepRun(treasure, 'right'); assert.equal(unfinished.status, 'playing'); assert.match(unfinished.message, /coin/);
  assert.equal(stepRun(stepRun(unfinished, 'right'), 'left').status, 'won');
});

test('checkpoints replay exact valid state, including blocked facing changes, choices, memory reset, and retry', () => {
  let session = createJourney({ seed: 'resume', length: 3 }, 'resume');
  for (const action of ['up', 'interact:guide', 'choose:shield', 'close-dialogue', 'right', 'down', 'forget', 'wait']) session = advanceJourney(session, action);
  const restored = restoreJourney(serializeJourney(session));
  assert.deepEqual(restored.run, session.run); assert.deepEqual(restored.config, session.config);
  const retry = retryLeg(session); assert.equal(retry.retries, 1); assert.equal(retry.run.turns, 0); assert.equal(retry.run.memory.observations, session.run.memory.observations);
  assert.deepEqual(restoreJourney(serializeJourney(retry)).run, retry.run); assert.equal(session.run.turns > 0, true);
});

test('invalid, oversized, tampered, and future checkpoints cannot overwrite map saves or valid progress', () => {
  const storage = store(), session = advanceJourney(createJourney({ seed: 'backup', length: 3 }, 'backup'), 'right');
  assert.equal(saveJourney(storage, session).saved, true); assert.equal(peekJourney(storage).header.config.seed, 'backup');
  assert.deepEqual(loadJourney(storage).session.run, session.run);
  const raw = JSON.parse(serializeJourney(session));
  for (const mutate of [data => { data.version = 99; }, data => { data.rules = 'old'; }, data => { data.state.leg = 99; }, data => { data.state.phase = 'won'; },
    data => { data.state.config = null; }, data => { data.state.perks = ['unknown']; }, data => { data.state.journal = ['<script>']; }, data => { data.fingerprint = 'bad'; }, data => { data.state.loadout.health = 999; }]) {
    const data = structuredClone(raw); mutate(data); assert.throws(() => restoreJourney(JSON.stringify(data)));
  }
  assert.throws(() => restoreJourney('x'.repeat(220_001))); assert.throws(() => restoreJourney('{'));
  assert.throws(() => serializeJourney({ ...session, journal: Array(MAX_JOURNAL + 1).fill('wait') }));
  const denied = { getItem() { throw Error('denied'); }, setItem() { throw Error('quota'); } };
  assert.equal(saveJourney(denied, session).saved, false); assert.equal(loadJourney(denied).session, null);
  assert.equal(peekJourney(denied).unavailable, true);
  assert.equal(storage.values.get('tilewright.document.v1'), 'keep-map'); assert.equal(storage.values.get('tilewright.adventures.v1'), 'keep-bests'); assert.equal(storage.values.get('tilewright.tactics.v1'), 'keep-memory');
});

test('logbook credits are idempotent, retain all receipts on import, and normalize corrupt storage', () => {
  const receipt = { leg: 0, family: 'courier', biome: 'woodland', score: 500, turns: 60, stars: 3, damage: 0, coins: 6, totalCoins: 6, delivered: true, rescues: 0, relays: 0 };
  const session = { id: 'credit', phase: 'won', config: expeditionConfig({ mode: 'contract', seed: 'credit' }), leg: 0, receipts: [receipt], retries: 0 };
  const first = creditJourney(emptyLogbook(), session); assert.equal(first.book.stats.legs, 1); assert.equal(first.book.stats.finishes, 1);
  assert.ok(first.book.badges.includes('courier')); assert.ok(first.book.badges.includes('treasure'));
  const again = creditJourney(first.book, session); assert.deepEqual(again.book, first.book); assert.deepEqual(again.earned, []);
  const storage = store(); assert.equal(saveLogbook(storage, first.book), true); assert.deepEqual(loadLogbook(storage), first.book);
  storage.setItem(LOGBOOK_KEY, '{'); assert.deepEqual(loadLogbook(storage), emptyLogbook());
  storage.setItem(LOGBOOK_KEY, 'x'.repeat(96_001)); assert.deepEqual(loadLogbook(storage), emptyLogbook());
  assert.equal(storage.values.get('tilewright.document.v1'), 'keep-map');
});

test('30,000 varied inputs across seeds, rules, and oaths preserve bounded state and resumable checkpoints', () => {
  let observed = 0;
  for (let seed = 0; seed < 100; seed++) {
    let session = createJourney({ seed: `soak-${seed}`, length: [3, 6, 9][seed % 3], difficulty: seed % 2 ? 'trail' : 'nemesis', vow: VOWS[seed % VOWS.length].id }, `soak-${seed}`);
    const random = randomFor(`inputs-${seed}`);
    for (let i = 0; i < 300; i++) {
      if (session.phase === 'lost') session = retryLeg(session);
      if (session.phase !== 'playing') break;
      const run = session.run, interactions = nearbyInteractions(run), moves = ['up', 'right', 'down', 'left'].filter((_, index) => {
        const [dx, dy] = [[0, -1], [1, 0], [0, 1], [-1, 0]][index]; return canEnter(run, { x: run.player.x + dx, y: run.player.y + dy }, true);
      });
      const choices = run.dialogue ? ['close-dialogue', ...(run.stage.npcs.find(npc => npc.id === run.dialogue).choices || []).map(choice => `choose:${choice.id}`)]
        : [...moves, ...moves.map(move => `dash-${move}`), 'wait', 'shield', 'decoy', ...(interactions[0] ? [`interact:${interactions[0].id}`] : []), ...(run.carrying ? ['drop-cargo'] : [])];
      session = advanceJourney(session, choices[Math.floor(random() * choices.length)]); observed++;
      assert.ok(session.run.health >= 0 && session.run.health <= 3); assert.ok(session.run.energy >= 0 && session.run.energy <= 3);
      assert.ok(session.run.decoys >= 0 && session.run.decoys <= 3 && session.run.shields >= 0 && session.run.shields <= 3);
      assert.ok(session.run.player.x >= 0 && session.run.player.x < session.run.stage.map.width && session.run.player.y >= 0 && session.run.player.y < session.run.stage.map.height);
      if (i % 75 === 0) assert.deepEqual(restoreJourney(serializeJourney(session)).run.player, session.run.player);
    }
  }
  assert.equal(observed, 30_000);
});

test('a retained finish token prevents re-crediting imported leg receipts after their individual tokens expire', () => {
  const receipt = { leg: 0, family: 'courier', biome: 'woodland', score: 500, turns: 60, stars: 3, damage: 0, coins: 6, totalCoins: 6, delivered: true, rescues: 0, relays: 0 };
  const session = { id: 'finished-history', phase: 'won', config: expeditionConfig({ mode: 'contract', seed: 'history' }), leg: 0, receipts: [receipt], retries: 0 };
  const complete = creditJourney(emptyLogbook(), session).book;
  const expired = { ...complete, credited: complete.credited.filter(token => token.endsWith('-finish')) };
  assert.deepEqual(creditJourney(expired, session).book, expired);
  assert.deepEqual(creditJourney(expired, { ...session, phase: 'camp' }).book, expired);
});
