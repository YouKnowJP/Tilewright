import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createDocument } from '../src/model.mjs';
import { createRun, stepRun, canEnter, missionComplete, resultFor, hazardActive } from '../src/adventure.mjs';
import { createGuildJobs, guildMerits, loadGuild, saveGuild, GUILD_KEY, guildRecordId } from '../src/adventure-guild.mjs';
import { powerProblem, waystoneProblem, waystonePreview } from '../src/adventure-tools.mjs';
import { planHunters } from '../src/adventure-tactics.mjs';
import { threatForecast } from '../src/adventure-intel.mjs';
import { restoreJourney, serializeJourney, advanceJourney } from '../src/adventure-journey.mjs';
const p = (x, y, id = 'marker') => ({ x, y, id });
const stones = () => [{ ...p(2, 2, 'west'), name: 'West', partner: 'east' }, { ...p(8, 5, 'east'), name: 'East', partner: 'west' }];
const stage = (overrides = {}) => ({ id: 'guild-1', name: 'Test dispatch', map: createDocument('Test dispatch', 12, 9),
  start: p(1, 2), exit: p(10, 7), lanterns: [p(10, 1, 'lamp')], waystones: stones(),
  guild: { kit: 'bellrunner', merits: ['clean', 'treasure', 'power'] }, ...overrides });
const fixtures = JSON.parse(readFileSync(new URL('fixtures/guild-routes.json', import.meta.url), 'utf8'));
for (const fixture of fixtures) test(`Guild clean full win: ${fixture.id}/${fixture.kit}/${fixture.difficulty}`, () => {
  const definition = createGuildJobs(fixture.kit).find(s => s.id === fixture.id), before = structuredClone(definition), initial = createRun(definition, { difficulty: fixture.difficulty });
  const final = fixture.actions.reduce(stepRun, initial);
  assert.equal(final.status, 'won'); assert.equal(missionComplete(final), true); assert.equal(final.damage, 0);
  assert.deepEqual(resultFor(final), fixture.result); assert.equal(fixture.result.stars, 3);
  assert.deepEqual(guildMerits(final), fixture.merits); assert.ok(guildMerits(final).every(merit => merit.done));
  assert.deepEqual(final.guild, fixture.guild); assert.ok(final.guild.uses > 0 && final.guild.warps > 0);
  if (definition.relic) assert.equal(final.cargoDelivered, true);
  for (const id of definition.requiredRescues || []) assert.ok(final.rescued.includes(id));
  assert.deepEqual(definition, before); assert.equal(initial.turns, 0);
});
test('all six jobs and both kits have independent ordinary-action witnesses for both rule sets', () => {
  assert.equal(fixtures.length, 24);
  assert.equal(new Set(fixtures.map(f => `${f.id}/${f.kit}/${f.difficulty}`)).size, 24);
  assert.equal(new Set(createGuildJobs().map(stage => JSON.stringify(stage.map.layers))).size, 6);
});
test('pulse cancels a nearby committed move and sweep, expires, respects walls, and retains earlier snapshots', () => {
  const definition = stage({ hunters: [{ id: 'near', route: [p(3, 2), p(3, 3)] }, { id: 'far', route: [p(9, 7), p(10, 7)] }] });
  const initial = createRun(definition), original = structuredClone(initial), near = initial.hunters[0];
  const warned = { ...initial, hunters: [{ ...near, intent: p(2, 2), attack: [p(1, 2)] }, initial.hunters[1]] };
  const next = stepRun(warned, 'power');
  assert.equal(next.damage, 0); assert.equal(next.energy, 1); assert.equal(next.turns, 1); assert.equal(next.guild.readyAt, 6);
  assert.equal(next.hunters[0].x, 3); assert.equal(next.hunters[0].mode, 'resonance dazed'); assert.deepEqual(next.hunters[0].attack, []);
  assert.equal(next.hunters[1].dazedUntil, undefined); assert.deepEqual(initial, original);
  const second = stepRun(next, 'down'); assert.equal(second.hunters[0].x, 3); assert.equal(second.hunters[0].y, 2);
  assert.notEqual(second.hunters[0].mode, 'resonance dazed');
  const walled = structuredClone(definition); walled.waystones = []; for (let y = 0; y < 9; y++) walled.map.layers[1].tiles[y * 12 + 2] = 9;
  assert.equal(stepRun(createRun(walled), 'power').hunters[0].dazedUntil, undefined);
});
test('pulse does not grant contact or ember immunity and cannot be spammed through reading or invalid moves', () => {
  const run = createRun(stage({ hazards: [{ ...p(1, 2), period: 4, phases: [1] }] }));
  const next = stepRun(run, 'power'); assert.equal(next.damage, 1);
  const again = stepRun(next, 'power'); assert.equal(again.turns, next.turns); assert.equal(again.energy, next.energy); assert.equal(again.guild.uses, 1);
  threatForecast(next); assert.equal(powerProblem(next), 'Recharges in 5 turns.');
  const ready = Array(5).fill('wait').reduce(stepRun, { ...next, stage: { ...next.stage, hazards: [] } });
  assert.equal(powerProblem(ready), null); assert.equal(stepRun(ready, 'power').guild.uses, 2);
  const contact = createRun(stage({ hunters: [{ id: 'near', route: [p(1, 2), p(2, 2)] }] }));
  assert.equal(stepRun(contact, 'power').damage, 1);
});
test('veil retains the current enemy move and recent lead while blocking new sight; cargo and alarms break concealment', () => {
  const initial = createRun(stage({ guild: { kit: 'mistweaver', merits: ['clean', 'power', 'swift'] }, hunters: [{ id: 'near', route: [p(4, 2), p(4, 3)], vision: 9 }] }));
  const intent = { ...initial.hunters[0].intent }, next = stepRun(initial, 'power');
  assert.deepEqual({ x: next.hunters[0].x, y: next.hunters[0].y }, intent);
  assert.equal(next.guild.veilUntil, 4); assert.equal(next.hunters[0].mode, 'searching');
  assert.deepEqual(next.hunters[0].lastSeen, initial.player);
  const moved = stepRun(next, 'down'); assert.deepEqual(moved.hunters[0].lastSeen, initial.player);
  for (const patch of [{ carrying: true }, { alarm: 2 }]) {
    const exposed = { ...next, ...patch, player: p(2, 3) }, hunter = planHunters(exposed, canEnter)[0];
    assert.deepEqual(hunter.lastSeen, exposed.player); assert.match(hunter.mode, /pursuing|intercepting/);
  }
});
test('waystone travel costs one turn and energy, collects the landing, reveals fog, carries cargo, and advances enemies', () => {
  const initial = createRun(stage({ lanterns: [p(8, 5, 'lamp')], coins: [p(8, 5, 'coin')], exit: p(10, 7),
    relic: { ...p(9, 5, 'relic'), name: 'Cargo' }, delivery: p(8, 5), hunters: [{ id: 'far', route: [p(10, 7), p(10, 6)] }] }));
  const next = stepRun({ ...initial, carrying: true, cargoPoint: null }, 'interact:west');
  assert.deepEqual(next.player, { x: 8, y: 5 }); assert.equal(next.energy, 2); assert.equal(next.turns, 1); assert.equal(next.guild.warps, 1);
  assert.deepEqual(next.collectedLanterns, ['lamp']); assert.deepEqual(next.collectedCoins, ['coin']); assert.equal(next.seen[5 * 12 + 8], true);
  assert.equal(next.cargoDelivered, true); assert.equal(next.carrying, false); assert.equal(initial.guild.warps, 0);
  assert.deepEqual({ x: next.hunters[0].x, y: next.hunters[0].y }, initial.hunters[0].intent);
});
test('occupied and powerless jumps reject without spending a turn, while landing forecasts warn of committed threats and embers', () => {
  const initial = createRun(stage({ hunters: [{ id: 'landing', route: [p(8, 5), p(8, 6)] }] }));
  for (const run of [initial, { ...initial, hunters: [], energy: 0 }, { ...initial, hunters: [], crates: [p(8, 5)] }]) {
    const next = stepRun(run, 'interact:west'); assert.equal(next.turns, 0); assert.equal(next.energy, run.energy); assert.equal(next.guild.warps, 0);
    assert.ok(waystoneProblem(run, run.stage.waystones[0], canEnter));
  }
  const warned = { ...initial, hunters: [{ ...initial.hunters[0], x: 8, y: 6, intent: p(8, 5), attack: [] }], stage: { ...initial.stage, hazards: [{ ...p(8, 5), period: 4, phases: [1] }] } };
  const before = structuredClone(warned), text = waystonePreview(warned, warned.stage.waystones[0], canEnter, hazardActive);
  assert.match(text, /threatens the landing/); assert.match(text, /burns next turn/); assert.deepEqual(warned, before);
  assert.equal(stepRun(warned, 'interact:west').damage, 1);
});
test('malformed pairs, duplicate interaction IDs, obstructed terrain, kits, and merits reject at creation', () => {
  for (const patch of [
    { waystones: [stones()[0]] }, { waystones: [stones()[0], { ...stones()[1], partner: 'missing' }] },
    { waystones: [stones()[0], { ...stones()[1], x: 2, y: 2 }] }, { waystones: [{ ...stones()[0], x: 80 }, stones()[1]] },
    { supplies: [p(4, 4, 'west')] }, { guild: { kit: 'unknown', merits: ['clean', 'power', 'swift'] } }, { guild: { kit: 'bellrunner', merits: ['clean', 'clean', 'swift'] } },
  ]) assert.throws(() => createRun(stage(patch)));
  const blocked = stage(); blocked.map.layers[1].tiles[5 * 12 + 8] = 9; assert.throws(() => createRun(blocked), /walkable/);
});
test('commendations are optional and cannot block a finish, while records prioritize merits and retain kit/rule separation', () => {
  const run = createRun(stage({ lanterns: [p(2, 2, 'lamp')], exit: p(2, 2), coins: [p(10, 7, 'coin')] }));
  const final = stepRun(run, 'right'); assert.equal(final.status, 'won'); assert.deepEqual(guildMerits(final).map(m => m.done), [true, false, false]);
  const values = new Map(), storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const saved = saveGuild(storage, {}, final, resultFor(final).score); assert.equal(saved.saved, true); assert.equal(saved.records[guildRecordId(final)].merits, 1);
  const all = { ...final, guild: { ...final.guild, uses: 1 }, collectedCoins: ['coin'] }, improved = saveGuild(storage, saved.records, all, 50);
  assert.equal(improved.records[guildRecordId(final)].merits, 3); assert.deepEqual(loadGuild(storage), improved.records);
  assert.deepEqual(saveGuild(storage, improved.records, final, 9999).records, improved.records);
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); } };
  assert.equal(saveGuild(blocked, {}, final, 100).saved, false); assert.deepEqual(loadGuild(blocked), {});
  for (const value of ['{', JSON.stringify({ version: 2, records: improved.records }), 'x'.repeat(16001), JSON.stringify({ version: 1, records: { 'guild-1-fake-trail': { merits: 3, turns: 2, score: 2 } } })]) { storage.setItem(GUILD_KEY, value); assert.deepEqual(loadGuild(storage), {}); }
  assert.throws(() => saveGuild(storage, {}, run, 100), /Finish/);
});
const legacy = JSON.parse(readFileSync(new URL('fixtures/pre-guild-checkpoints.json', import.meta.url), 'utf8'));
for (const fixture of legacy) test(`genuine pre-Guild 0.6 backup restores: ${fixture.id}`, () => {
  const restored = restoreJourney(JSON.stringify(fixture.checkpoint)); assert.equal(restored.phase, fixture.phase); assert.equal(restored.run.turns, fixture.turns);
  assert.deepEqual(restored.run.player, fixture.player); assert.equal(Object.hasOwn(restored.run, 'guild'), false);
  const next = advanceJourney(restored, restored.run.dialogue ? 'close-dialogue' : 'wait'); assert.deepEqual(restoreJourney(serializeJourney(next)).run, next.run);
});
test('24,000 varied Guild inputs preserve resources, valid landings, bounded cooldowns, and earlier tool state', () => {
  let seed = 9026;
  const choose = count => { seed = Math.imul(seed, 1664525) + 1013904223 >>> 0; return seed % count; };
  for (const kit of ['bellrunner', 'mistweaver']) for (const stage of createGuildJobs(kit)) for (const difficulty of ['trail', 'nemesis']) {
    let run = createRun(stage, { difficulty });
    for (let i = 0; i < 1000; i++) {
      if (run.status !== 'playing') run = createRun(stage, { difficulty, memory: run.memory });
      const actions = run.dialogue ? ['close-dialogue'] : ['up', 'right', 'down', 'left', 'dash-up', 'dash-right', 'dash-down', 'dash-left', 'wait', 'power', 'shield', 'decoy', 'drop-cargo',
        ...[...stage.waystones, ...stage.npcs, ...stage.supplies, ...stage.relays, ...stage.switches, ...(stage.relic ? [stage.relic] : [])].map(item => `interact:${item.id}`)];
      const prior = run, tools = { ...run.guild }; run = stepRun(run, actions[choose(actions.length)]);
      assert.deepEqual(prior.guild, tools); assert.equal(canEnter(run, run.player), true);
      assert.ok(run.energy >= 0 && run.energy <= 3 && run.health >= 0 && run.health <= 3);
      assert.ok(run.decoys >= 0 && run.decoys <= 3 && run.shields >= 0 && run.shields <= 3);
      assert.ok(run.guild.readyAt - run.turns <= 5 && run.guild.veilUntil - run.turns <= 3);
      assert.ok(run.guild.uses >= tools.uses && run.guild.uses <= tools.uses + 1 && run.guild.uses <= run.turns);
      assert.ok(run.guild.warps >= tools.warps && run.guild.warps <= tools.warps + 1);
    }
  }
});

const alternateRoutes = JSON.parse(readFileSync(new URL('fixtures/guild-alternate-routes.json', import.meta.url), 'utf8'));
for (const id of ['guild-2', 'guild-5']) test(`Optional route remains a clean win without Traveler: ${id}`, () => {
  const cases = alternateRoutes.filter(route => route.id === id); assert.equal(cases.length, 4);
  for (const fixture of cases) {
    const run = fixture.actions.reduce(stepRun, createRun(createGuildJobs(fixture.kit).find(stage => stage.id === id), { difficulty: fixture.difficulty }));
    assert.equal(run.status, 'won'); assert.equal(run.damage, 0); assert.equal(resultFor(run).stars, 3);
    assert.deepEqual(resultFor(run), fixture.result); assert.deepEqual(guildMerits(run), fixture.merits);
    assert.equal(guildMerits(run).find(merit => merit.id === 'travel').done, false);
    assert.equal(run.guild.warps, id === 'guild-2' ? 0 : 1);
    if (id === 'guild-2') assert.ok(run.openGates.includes('minute-lock'));
  }
});
