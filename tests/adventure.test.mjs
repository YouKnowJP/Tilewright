import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createDocument } from '../src/model.mjs';
import { createRun, stepRun, canEnter, activePlates, gateIsOpen, enemyIntent, resultFor, createCustomStage, walkableCells, scoutHint } from '../src/adventure.mjs';
import { createCampaign } from '../src/adventure-levels.mjs';

const point = (x, y, id = 'item') => ({ x, y, id });
const stage = (overrides = {}) => ({ id: 'test', name: 'Test trail', par: 20, map: createDocument('Test', 8, 5),
  start: point(1, 2), exit: point(6, 2), lanterns: [point(6, 1, 'light')], ...overrides });
const steps = (run, actions) => actions.reduce(stepRun, run);

test('keys unlock a gate once, and blocked moves never advance patrols or spend energy', () => {
  const definition = stage({ keys: [point(2, 2, 'key')], gates: [{ ...point(3, 2, 'gate'), type: 'key' }],
    enemies: [{ id: 'warden', route: [point(6, 3), point(7, 3)] }] });
  const original = createRun(definition);
  const locked = { ...original, player: point(3, 1) };
  const blocked = stepRun(locked, 'down');
  assert.equal(blocked.turns, 0); assert.equal(blocked.energy, 3);
  assert.deepEqual(blocked.enemies, original.enemies); assert.match(blocked.message, /key/);
  const key = stepRun(original, 'right'); assert.equal(key.keyCount, 1);
  const open = stepRun(key, 'right'); assert.equal(open.keyCount, 0);
  assert.deepEqual(open.openGates, ['gate']); assert.ok(gateIsOpen(open, open.stage.gates[0]));
  assert.equal(steps(open, ['left', 'right']).turns, 4);
  assert.equal(original.collectedKeys.length, 0); assert.equal(definition.keys.length, 1);
});

test('crates activate linked plates, and every plate is required to open a river crossing', () => {
  const definition = stage({ crates: [point(2, 2, 'box'), point(4, 3, 'box-2')],
    plates: [point(3, 2, 'plate'), point(5, 3, 'plate-2')],
    gates: [{ ...point(6, 2, 'crossing'), type: 'bridge', plates: ['plate', 'plate-2'] }] });
  definition.map.layers[0].tiles[2 * 8 + 6] = 3;
  const original = createRun(definition), first = stepRun(original, 'right');
  assert.deepEqual(first.crates[0], point(3, 2, 'box')); assert.deepEqual(activePlates(first), ['plate']);
  assert.equal(canEnter(first, point(6, 2)), false);
  const second = steps(first, ['down', 'right', 'right', 'right']);
  assert.deepEqual(activePlates(second), ['plate', 'plate-2']);
  assert.equal(canEnter(second, point(6, 2)), true);
  assert.deepEqual(original.crates[0], point(2, 2, 'box'));
  const closed = stepRun({ ...second, player: point(2, 2) }, 'right');
  assert.equal(gateIsOpen(closed, closed.stage.gates[0]), false, 'Moving a crate off a plate closes its bridge.');
});

test('crates cannot be pushed through obstacles, other crates, or map boundaries', () => {
  const original = createRun(stage({ start: point(5, 2), crates: [point(6, 2, 'a'), point(7, 2, 'b')] }));
  assert.equal(stepRun(original, 'right').turns, 0);
  const edge = createRun(stage({ start: point(6, 2), crates: [point(7, 2)] }));
  assert.equal(stepRun(edge, 'right').turns, 0);
  const obstacle = stage({ crates: [point(2, 2)] }); obstacle.map.layers[1].tiles[2 * 8 + 3] = 7;
  assert.equal(stepRun(createRun(obstacle), 'right').turns, 0);
  assert.equal(canEnter(original, point(-1, 2)), false);
});

test('dash collects intermediate pickups, costs two energy, and advances patrols only once', () => {
  const original = createRun(stage({ lanterns: [point(2, 2, 'light')], coins: [point(3, 2, 'coin')],
    enemies: [{ id: 'warden', route: [point(5, 4), point(6, 4), point(7, 4)] }] }));
  const dashed = stepRun(original, 'dash-right');
  assert.deepEqual(dashed.player, { x: 3, y: 2 }); assert.equal(dashed.energy, 1); assert.equal(dashed.turns, 1);
  assert.deepEqual(dashed.collectedLanterns, ['light']); assert.deepEqual(dashed.collectedCoins, ['coin']);
  assert.equal(dashed.enemies[0].index, 1); assert.equal(stepRun(dashed, 'dash-right').turns, 1);
  const charged = stepRun(dashed, 'wait'); assert.equal(charged.energy, 2);
  assert.equal(stepRun(charged, 'up').energy, 3);
  const wall = createRun(stage({ start: point(0, 2) }));
  assert.equal(stepRun(wall, 'dash-left').energy, 3);
  assert.equal(stepRun(wall, 'dash-left').turns, 0);
});

test('patrol intent predicts ping-pong movement and respects closed gates and crates', () => {
  const original = createRun(stage({ enemies: [{ id: 'w', route: [point(5, 3), point(6, 3), point(7, 3)] }] }));
  let run = original;
  for (const expected of [1, 2, 1, 0, 1]) {
    assert.equal(enemyIntent(run, run.enemies[0]).index, expected);
    run = stepRun(run, 'wait'); assert.equal(run.enemies[0].index, expected);
  }
  const blocked = createRun(stage({ crates: [point(6, 3)], enemies: original.stage.enemies }));
  assert.equal(stepRun(blocked, 'wait').enemies[0].index, 0);
});

test('warden collisions remove hearts, grant two protected turns, and eventually end the run', () => {
  let run = createRun(stage({ enemies: [{ id: 'w', route: [point(2, 2), point(3, 2)] }] }));
  run = stepRun(run, 'right'); assert.equal(run.health, 2); assert.equal(run.invulnerability, 2);
  run = steps(run, ['wait', 'wait']); assert.equal(run.health, 2); assert.equal(run.invulnerability, 0);
  run = stepRun(run, 'wait'); assert.equal(run.health, 1);
  run = steps(run, ['wait', 'wait', 'wait', 'wait']); assert.equal(run.status, 'lost');
  assert.equal(run.health, 0); assert.equal(resultFor(run), null);
  assert.equal(stepRun(run, 'left'), run, 'A finished run cannot advance.');
});

test('heart pickups remain available at full health and heal without exceeding three hearts', () => {
  const run = createRun(stage({ hearts: [point(2, 2, 'heart')] }));
  const full = stepRun(run, 'right'); assert.deepEqual(full.collectedHearts, []);
  const healed = stepRun({ ...full, health: 2 }, 'wait');
  assert.equal(healed.health, 3); assert.deepEqual(healed.collectedHearts, ['heart']);
  assert.equal(stepRun(healed, 'wait').collectedHearts.length, 1);
});

test('the beacon needs all lanterns, dash stops on a completed beacon, and scoring rewards clean efficient routes', () => {
  const original = createRun(stage({ exit: point(2, 2), lanterns: [point(3, 2, 'light')] }));
  const empty = stepRun(original, 'right'); assert.equal(empty.status, 'playing'); assert.match(empty.message, /1 more lantern/);
  const lit = stepRun(empty, 'right'), won = stepRun(lit, 'dash-left');
  assert.equal(won.player.x, 2); assert.equal(won.status, 'won'); assert.equal(resultFor(won).stars, 3);
  assert.equal(resultFor({ ...won, damage: 1, health: 2 }).stars, 2);
  assert.equal(resultFor({ ...won, turns: 31 }).stars, 1);
  assert.equal(resultFor(won).score - resultFor({ ...won, turns: won.turns + 1 }).score, 5);
  assert.equal(resultFor({ ...won, collectedCoins: ['a'] }).score - resultFor(won).score, 25);
});

test('all three authored adventures are completable with three stars using ordinary moves', () => {
  const routes = JSON.parse(readFileSync(new URL('fixtures/adventure-routes.json', import.meta.url)));
  const turns = [];
  for (const definition of createCampaign().slice(0, 3)) {
    const before = JSON.stringify(definition), initial = createRun(definition);
    const won = steps(initial, routes[definition.id]);
    assert.equal(won.status, 'won', definition.name); assert.equal(won.health, 3); assert.equal(won.damage, 0);
    assert.equal(resultFor(won).stars, 3); assert.ok(won.turns <= definition.par);
    assert.equal(won.collectedLanterns.length, 3); assert.equal(won.openGates.length, definition.keys.length);
    assert.equal(activePlates(won).length, definition.plates.length);
    assert.ok(won.seen.filter(Boolean).length > initial.seen.filter(Boolean).length);
    assert.equal(JSON.stringify(definition), before, 'Gameplay must not mutate level definitions.'); turns.push(won.turns);
  }
  assert.deepEqual(turns, [54, 50, 73]);
});

test('walkability follows visible layer order, and flowers cannot turn water or empty cells into land', () => {
  const map = createDocument('Layers', 6, 1);
  map.layers[0].tiles = [3, 0, 1, 1, 3, 1]; map.layers[1].tiles = [10, 10, 7, 12, 12, 9];
  assert.deepEqual(walkableCells(map), [false, false, false, true, true, false]);
  map.layers[1].visible = false;
  assert.deepEqual(walkableCells(map), [false, false, true, true, false, true]);
});

test('custom expeditions use the largest connected land area, have reachable distinct objectives, and never alter maps', () => {
  const map = createDocument('Islands', 8, 4);
  map.layers[0].tiles.fill(3);
  for (const index of [0, 1, 8, 9, 4, 5, 6, 12, 13, 14, 20, 21, 22]) map.layers[0].tiles[index] = 1;
  const before = JSON.stringify(map), custom = createCustomStage(map), run = createRun(custom);
  assert.deepEqual(createCustomStage(map), custom); assert.equal(JSON.stringify(map), before);
  assert.equal(custom.start.x, 4); assert.equal(custom.lanterns.length, 3); assert.equal(custom.enemies.length, 0);
  const markers = [custom.start, custom.exit, ...custom.lanterns];
  assert.equal(new Set(markers.map(p => `${p.x},${p.y}`)).size, 5);
  const visited = new Set(), queue = [run.player];
  while (queue.length) {
    const p = queue.shift(), key = `${p.x},${p.y}`; if (visited.has(key) || !canEnter(run, p)) continue;
    visited.add(key); queue.push({ x: p.x + 1, y: p.y }, { x: p.x - 1, y: p.y }, { x: p.x, y: p.y + 1 }, { x: p.x, y: p.y - 1 });
  }
  for (const p of markers) assert.ok(visited.has(`${p.x},${p.y}`));
  custom.map.layers[0].tiles[0] = 1; assert.equal(JSON.stringify(map), before);
  assert.throws(() => createCustomStage(createDocument('Tiny', 5, 1)), /six connected/);
  assert.throws(() => createCustomStage({ ...map, width: 999 }), /dimensions/);
});

test('bad level markers and disconnected patrol routes are rejected, and unknown actions do nothing', () => {
  assert.throws(() => createRun(stage({ start: point(-1, 0) })), /inside/);
  assert.throws(() => createRun(stage({ gates: [{ ...point(3, 2), type: 'bridge', plates: ['absent'] }] })), /gates/);
  assert.throws(() => createRun(stage({ enemies: [{ route: [point(2, 1), point(5, 1)] }] })), /adjacent/);
  const run = createRun(stage()); assert.equal(stepRun(run, null), run); assert.equal(stepRun(run, 'dance'), run);
  assert.match(scoutHint(run), /north-east/);
});

test('custom objectives work on minimum connected land and cannot span disconnected specks', () => {
  const custom = createCustomStage(createDocument('Small trail', 6, 1));
  const won = steps(createRun(custom), Array(5).fill('right'));
  assert.equal(won.status, 'won'); assert.equal(resultFor(won).stars, 3);
  assert.ok(custom.par < 12, 'A tiny expedition should have a meaningful route target.');
  const islands = createDocument('Specks', 10, 10);
  islands.layers[0].tiles = islands.layers[0].tiles.map((_, i) => (i % 10 + Math.floor(i / 10)) % 2 ? 3 : 1);
  assert.throws(() => createCustomStage(islands), /six connected/);
});
