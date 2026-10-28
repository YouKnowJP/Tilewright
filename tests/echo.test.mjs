import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createDocument } from '../src/model.mjs';
import { createRun, stepRun, canEnter, activePlates, gateIsOpen, hazardActive, resultFor } from '../src/adventure.mjs';
import { liveEcho, powerProblem, powerPreview } from '../src/adventure-tools.mjs';
import { planHunters } from '../src/adventure-tactics.mjs';
import { threatForecast } from '../src/adventure-intel.mjs';
import { createGuildJobs, saveGuild, loadGuild } from '../src/adventure-guild.mjs';
const p = (x, y, id = 'marker') => ({ x, y, id });
const stage = (extra = {}) => ({ id: 'guild-7', name: 'Double test', map: createDocument('Double test', 12, 9),
  start: p(2, 3), exit: p(10, 7), lanterns: [p(10, 1, 'lamp')],
  guild: { kit: 'echoist', merits: ['clean', 'power', 'travel'] }, ...extra });
const cast = extra => stepRun(createRun(stage(extra)), 'power');

test('cast and return have distinct costs, keep cooldowns, and preserve previous snapshots', () => {
  const initial = createRun(stage()), before = structuredClone(initial), double = stepRun(initial, 'power');
  assert.deepEqual(initial, before); assert.equal(double.turns, 1); assert.equal(double.energy, 1);
  assert.deepEqual(double.guild.echo, { x: 2, y: 3, until: 7 }); assert.equal(double.guild.readyAt, 6);
  const moved = stepRun(double, 'right'), snapshot = structuredClone(moved), returned = stepRun(moved, 'power');
  assert.deepEqual(moved, snapshot); assert.deepEqual(returned.player, { x: 2, y: 3 }); assert.equal(returned.energy, 1);
  assert.equal(returned.turns, 3); assert.equal(returned.guild.echo, null); assert.equal(returned.guild.uses, 1); assert.equal(returned.guild.swaps, 1);
  assert.equal(returned.guild.readyAt, 6); assert.equal(powerProblem(returned, canEnter), 'Recharges in 3 turns.');
  assert.equal(returned.memory.observations, 1); assert.equal(double.guild.echo.until, 7);
});
test('reading, dialogue, and blocked input do not consume the double; it expires after six further turns', () => {
  const definition = stage({ npcs: [{ ...p(1, 3, 'ivo'), name: 'Ivo', lines: ['Stay awhile.'], choices: [] }] });
  let run = stepRun(createRun(definition), 'power'), before = structuredClone(run);
  assert.match(threatForecast(run).join(' '), /6 turns left/); assert.deepEqual(run, before);
  for (const action of ['interact:ivo', 'right', 'power', 'close-dialogue', 'invalid']) run = stepRun(run, action);
  assert.equal(run.turns, 1); assert.equal(run.guild.echo.until, 7);
  run = stepRun(run, 'right');
  run = Array(4).fill('wait').reduce(stepRun, run); assert.equal(run.turns, 6); assert.ok(liveEcho(run));
  run = stepRun(run, 'wait'); assert.equal(run.turns, 7); assert.equal(run.guild.echo, null);
  assert.equal(powerProblem(run, canEnter), null); assert.equal(stepRun(run, 'power').guild.uses, 2);
});
test('a double holds a copper plate remotely and new safety crossings close only when clear', () => {
  const definition = stage({ plates: [p(2, 3, 'plate')], gates: [{ ...p(4, 3, 'bridge'), type: 'bridge', plates: ['plate'], safeClose: true }] });
  const held = stepRun(cast(definition), 'right'); assert.deepEqual(activePlates(held), ['plate']); assert.equal(gateIsOpen(held, held.stage.gates[0]), true);
  let late = Array(4).fill('wait').reduce(stepRun, held); assert.equal(late.turns, 6);
  late = stepRun(late, 'right'); assert.equal(late.turns, 7); assert.equal(late.guild.echo, null); assert.equal(late.player.x, 4);
  assert.equal(canEnter(late, late.player), true);
  const clear = stepRun(late, 'right'); assert.equal(gateIsOpen(clear, clear.stage.gates[0]), false);
  for (const patch of [{ crates: [p(4, 3)] }, { companions: [p(4, 3)] }, { hunters: [p(4, 3)] }, { enemies: [{ route: [p(4, 3)], index: 0 }] }]) {
    assert.equal(gateIsOpen({ ...clear, ...patch }, clear.stage.gates[0]), true);
  }
});
test('hunters follow doubles, decoys take priority, and reaching a double extinguishes it without rewriting committed moves', () => {
  const run = cast({ hunters: [{ id: 'listener', route: [p(7, 3), p(7, 4)] }] });
  assert.equal(run.hunters[0].mode, 'following double');
  const away = { ...run, player: p(2, 6) }, planned = planHunters(away, canEnter)[0];
  assert.ok(planned.intent.x < planned.x);
  const decoy = planHunters({ ...away, lure: { x: 9, y: 3, until: 8 } }, canEnter)[0]; assert.equal(decoy.mode, 'distracted'); assert.ok(decoy.intent.x > decoy.x);
  const snapshot = structuredClone(run), victim = { ...run, player: p(2, 6), hunters: [{ ...run.hunters[0], x: 3, y: 3, intent: p(2, 3), attack: [] }] };
  const caught = stepRun(victim, 'wait'); assert.equal(caught.guild.echo, null); assert.equal(caught.hunters[0].x, 2); assert.equal(caught.damage, 0); assert.deepEqual(run, snapshot);
  const hit = stepRun(createRun(stage({ hunters: [{ id: 'near', route: [p(3, 3), p(4, 3)] }] })), 'power');
  assert.equal(hit.damage, 1); assert.equal(hit.guild.echo, null); assert.equal(hit.guild.uses, 1);
});
test('blocked or powerless returns reject freely, including gates and occupied landing cells', () => {
  const run = stepRun(cast(), 'right');
  for (const patch of [{ energy: 0 }, { crates: [p(2, 3)] }, { hunters: [{ ...p(2, 3), route: [p(2, 3), p(3, 3)], intent: p(2, 3), attack: [] }] },
    { stage: { ...run.stage, gates: [{ ...p(2, 3, 'key-door'), type: 'key' }] } }]) {
    const blocked = { ...run, ...patch }, before = structuredClone(blocked), next = stepRun(blocked, 'power');
    assert.ok(powerProblem(blocked, canEnter)); assert.equal(next.turns, run.turns); assert.equal(next.energy, blocked.energy); assert.deepEqual(next.guild, run.guild); assert.deepEqual(blocked, before);
  }
});
test('return forecasts warn about landing threats and returning still takes sweep and ember damage', () => {
  const run = stepRun(cast(), 'right');
  const warned = { ...run, stage: { ...run.stage, hazards: [{ ...p(2, 3), period: 4, phases: [3] }] },
    hunters: [{ id: 'listener', x: 4, y: 3, route: [p(4, 3), p(4, 4)], intent: p(3, 3), attack: [p(2, 3)], memory: 5 }] };
  const before = structuredClone(warned), text = powerPreview(warned, canEnter, hazardActive);
  assert.match(text, /sweep threatens/); assert.match(text, /burns next turn/); assert.deepEqual(warned, before);
  assert.equal(stepRun(warned, 'power').damage, 1);
  assert.equal(stepRun({ ...warned, stage: run.stage }, 'power').damage, 1);
});
test('return collects a landing, delivers cargo, carries companions, and reveals the destination without duplicating rewards', () => {
  const run = stepRun(cast({ relic: { ...p(8, 5, 'relic'), name: 'Lens' }, delivery: p(2, 3) }), 'right');
  const cargo = { ...run, carrying: true, cargoPoint: null, companions: [p(6, 5, 'neri')], stage: { ...run.stage, coins: [p(2, 3, 'coin')] } };
  const returned = stepRun(cargo, 'power'); assert.equal(returned.cargoDelivered, true); assert.equal(returned.carrying, false);
  assert.deepEqual(returned.companions[0], p(3, 3, 'neri')); assert.deepEqual(returned.collectedCoins, ['coin']);
  assert.equal(returned.seen[3 * 12 + 2], true); assert.deepEqual(stepRun(returned, 'wait').collectedCoins, ['coin']);
});
test('non-Guild runs retain their original state shape and cannot cast a double', () => {
  const definition = stage(); delete definition.guild; const run = createRun(definition), next = stepRun(run, 'power');
  assert.equal(Object.hasOwn(next, 'guild'), false); assert.equal(next.turns, 0);
});

const normal = JSON.parse(readFileSync(new URL('fixtures/guild-routes.json', import.meta.url), 'utf8'));
const alternate = JSON.parse(readFileSync(new URL('fixtures/guild-alternate-routes.json', import.meta.url), 'utf8')).filter(f => ['guild-7', 'guild-8'].includes(f.id));
test('new jobs have both dialogue branches on every kit and rule set, with real plate and double crossings', () => {
  assert.equal(alternate.length, 12);
  for (const fixture of [...normal.filter(f => ['guild-7', 'guild-8'].includes(f.id)), ...alternate]) {
    let run = createRun(createGuildJobs(fixture.kit).find(s => s.id === fixture.id), { difficulty: fixture.difficulty }), crossed = false, held = false;
    const bridgeY = fixture.id === 'guild-7' ? 5 : 6, bridgeX = fixture.id === 'guild-7' ? 12 : 14;
    for (const action of fixture.actions) {
      const previous = run; run = stepRun(run, action);
      if (!/^(interact:|choose:|close-dialogue)/.test(action)) assert.equal(run.turns, previous.turns + 1, `Unplayable alternate input: ${action}`);
      crossed ||= run.player.y === bridgeY && previous.player.y === bridgeY && Math.min(previous.player.x, run.player.x) <= bridgeX && Math.max(previous.player.x, run.player.x) >= bridgeX && ['right', 'left', 'dash-right', 'dash-left'].includes(action);
      held ||= Boolean(liveEcho(run)) && activePlates(run).length > 0;
    }
    assert.equal(run.status, 'won'); assert.equal(run.damage, 0); assert.equal(resultFor(run).stars, 3);
    assert.equal(run.choices.ivo, fixture.id === 'guild-7' ? fixture.alternate ? 'decoys' : 'shield' : fixture.alternate ? 'kit' : 'cool');
    if (fixture.id === 'guild-7' || fixture.alternate) { assert.equal(crossed, true); if (fixture.kit === 'echoist') { assert.equal(held, true); assert.ok(run.guild.swaps > 0); } }
    if (fixture.id === 'guild-8') { assert.equal(run.cargoDelivered, true); assert.ok(run.rescued.includes('neri')); assert.ok(run.openGates.includes('memory-lock')); }
  }
});
test('all 48 result categories round-trip while retaining the original 24 records', () => {
  let text, records = {}; const storage = { getItem: () => text, setItem: (_, value) => { text = value; } };
  for (const fixture of normal) {
    const run = fixture.actions.reduce(stepRun, createRun(createGuildJobs(fixture.kit).find(s => s.id === fixture.id), { difficulty: fixture.difficulty }));
    records = saveGuild(storage, records, run, resultFor(run).score).records;
  }
  assert.equal(Object.keys(records).length, 48); assert.deepEqual(loadGuild(storage), records); assert.ok(text.length < 16000);
});
