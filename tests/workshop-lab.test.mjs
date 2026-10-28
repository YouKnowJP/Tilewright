import test from 'node:test';
import assert from 'node:assert/strict';
import { LAB_ROOMS, puzzleLabWorld, transformAdventure, cursorPractice, designSpark } from '../src/workshop-lab.mjs';
import { LAB_CLEARS } from '../src/workshop-lab-clears.mjs';
import { adventureStage, checkAdventure, verifyAdventureProof, editAdventure, placeObject } from '../src/workshop-model.mjs';
import { createRun, stepRun } from '../src/adventure.mjs';
import { serializeAdventure, parseAdventure } from '../src/workshop-sharing.mjs';

for (const room of LAB_ROOMS) for (const difficulty of ['trail', 'nemesis']) test(`Puzzle Lab: ${room.title} completes on ${difficulty}`, () => {
  const pack = puzzleLabWorld(room.id); assert.deepEqual(checkAdventure(pack).errors, []);
  const run = LAB_CLEARS[room.id].reduce(stepRun, createRun(adventureStage(pack), { difficulty }));
  assert.equal(run.status, 'won'); assert.equal(run.damage, 0); assert.ok(run.turns <= pack.par);
});
test('all twelve original room clears survive portable export and actual engine verification', async () => {
  assert.equal(LAB_ROOMS.length, 12);
  for (const room of LAB_ROOMS) assert.equal((await verifyAdventureProof(parseAdventure(serializeAdventure(puzzleLabWorld(room.id))))).status, 'won');
});
test('rotated and mirrored rooms retain their real winning routes and stable puzzle links', () => {
  for (const room of LAB_ROOMS) for (const operation of ['rotate', 'mirror-x', 'mirror-y']) {
    const original = puzzleLabWorld(room.id), transformed = transformAdventure(original, operation);
    const mapping = operation === 'rotate' ? { up: 'right', right: 'down', down: 'left', left: 'up' } : operation === 'mirror-x' ? { left: 'right', right: 'left' } : { up: 'down', down: 'up' };
    const run = LAB_CLEARS[room.id].map(action => action.startsWith('dash-') ? `dash-${mapping[action.slice(5)] || action.slice(5)}` : mapping[action] || action).reduce(stepRun, createRun(adventureStage(transformed)));
    assert.equal(run.status, 'won', `${room.id}/${operation}`); assert.equal(transformed.proof, undefined);
    assert.deepEqual(transformed.markers.map(marker => [marker.id, marker.channel, marker.order]), original.markers.map(marker => [marker.id, marker.channel, marker.order]));
  }
});
test('four rotations and paired mirrors restore all layers, routes, metadata, and hidden-layer state', () => {
  let original = placeObject(puzzleLabWorld('counterweight'), 'patrol', 4, 3, { route: [{ x: 4, y: 3 }, { x: 5, y: 3 }] });
  original.map.layers.push({ id: 'notes', name: 'Hidden flowers', visible: false, tiles: Array(120).fill(10) });
  const before = structuredClone(original); let rotated = original;
  for (let i = 0; i < 4; i++) rotated = transformAdventure(rotated, 'rotate');
  assert.deepEqual(rotated, editAdventure(original, {}));
  for (const operation of ['mirror-x', 'mirror-y']) assert.deepEqual(transformAdventure(transformAdventure(original, operation), operation), editAdventure(original, {}));
  assert.deepEqual(original, before); assert.throws(() => transformAdventure(original, 'surprise'), /Choose rotate/);
});
test('the double crossing also has a clean crate solution on both rules', () => {
  const actions = ['up', 'up', 'up', 'right', 'right', 'down', 'down', 'right', 'down', 'right', 'right', 'right', 'down', 'down'];
  for (const difficulty of ['trail', 'nemesis']) {
    const run = actions.reduce(stepRun, createRun(adventureStage(puzzleLabWorld('footstep')), { difficulty }));
    assert.equal(run.status, 'won'); assert.equal(run.guild.uses, 0); assert.equal(run.damage, 0);
  }
});
test('the delivery room can be solved after taking supplies instead of the conversation shortcut', () => {
  const actions = LAB_CLEARS.tidekeeper.map(action => action === 'choose:route' ? 'choose:shield' : action);
  actions.splice(actions.indexOf('close-dialogue') + 1, 0, 'interact:ferry');
  for (const difficulty of ['trail', 'nemesis']) assert.equal(actions.reduce(stepRun, createRun(adventureStage(puzzleLabWorld('tidekeeper')), { difficulty })).status, 'won');
});
test('cursor practice accepts open land, retains goals, rejects blocked starts, and changes no world data', () => {
  const pack = puzzleLabWorld('counterweight'), before = structuredClone(pack), stage = cursorPractice(pack, { x: 5, y: 5 });
  const run = createRun(stage); assert.deepEqual(run.player, { x: 5, y: 5 }); assert.equal(stage.workshop.practice, true);
  assert.equal(run.collectedLanterns.length, 0); assert.equal(stage.workshop.key, adventureStage(pack).workshop.key);
  for (const point of [{ x: -1, y: 4 }, { x: 3.5, y: 4 }, { x: 0, y: 0 }, { x: 6, y: 4 }, { x: 6, y: 5 }, { x: 3, y: 5 }]) assert.throws(() => cursorPractice(pack, point), /open, walkable/);
  assert.throws(() => cursorPractice(puzzleLabWorld('tidekeeper'), { x: 3, y: 3 }), /open, walkable/);
  assert.deepEqual(pack, before);
});
test('design sparks are reproducible, bounded, and offer a varied set of creative briefs', () => {
  assert.deepEqual(designSpark('lantern-boat'), designSpark('lantern-boat'));
  const ideas = new Set(Array.from({ length: 500 }, (_, i) => JSON.stringify(designSpark(`spark-${i}`)))); assert.ok(ideas.size >= 30);
  assert.throws(() => designSpark('x'.repeat(65)), /64 characters/); assert.throws(() => puzzleLabWorld('unknown'), /known puzzle room/);
});
