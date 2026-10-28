import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { practiceWorld, paintPractice, tellPracticeStory, playLessonSteps, creatorLessonSteps, readTraining, saveTraining, practiceClear, TRAINING_KEY } from '../src/training-model.mjs';
import { adventureStage, checkAdventure, verifyAdventureProof, editAdventure } from '../src/workshop-model.mjs';
import { createRun, stepRun } from '../src/adventure.mjs';
import { serializeAdventure, parseAdventure } from '../src/workshop-sharing.mjs';

const routes = JSON.parse(await readFile(new URL('./fixtures/training-routes.json', import.meta.url), 'utf8'));
function makeWorld() {
  let pack = practiceWorld('create');
  for (const [brush, point] of [['bridge', { x: 5, y: 4 }], ['lantern', { x: 7, y: 3 }], ['guide', { x: 3, y: 3 }]]) pack = paintPractice(pack, brush, point);
  return tellPracticeStory(pack, { title: 'Moonbeam Island', intro: 'A lost light is waiting beyond the river.', dialogue: 'Take the bridge, find the light, then return to the turquoise beacon.' });
}
test('play lesson completes through real movement, conversation, lever, lantern, rescue, and return', () => {
  const pack = practiceWorld(); assert.equal(checkAdventure(pack).ready, true);
  let run = createRun(adventureStage(pack)); assert.ok(playLessonSteps(run).every(step => !step.done));
  for (const action of routes.play) run = stepRun(run, action);
  assert.equal(run.status, 'won'); assert.deepEqual(run.rescued, ['mira']);
  assert.ok(playLessonSteps(run).every(step => step.done)); assert.equal(run.damage, 0);
});
test('practice river door blocks passage until its lever opens, and reading costs no turns', () => {
  let run = createRun(adventureStage(practiceWorld()));
  for (const action of ['right', 'right']) run = stepRun(run, action);
  const before = run.turns; const blocked = stepRun(run, 'right');
  assert.equal(blocked.turns, before); assert.deepEqual(blocked.player, run.player);
  run = stepRun(stepRun(run, 'interact:crossing'), 'right'); assert.equal(run.player.x, 5);
  const first = createRun(adventureStage(practiceWorld()));
  const talking = stepRun(stepRun(first, 'up'), 'interact:mira');
  assert.equal(stepRun(talking, 'close-dialogue').turns, talking.turns);
});
test('creator lesson requires actual goals, story, checks, a win, and a keep action', () => {
  const empty = practiceWorld('create'); assert.equal(checkAdventure(empty).ready, false);
  const pack = makeWorld(); assert.equal(checkAdventure(pack).ready, true);
  assert.deepEqual(creatorLessonSteps(pack).map(step => step.done), [true, true, true, true, false, false, false]);
  const run = routes.create.reduce(stepRun, createRun(adventureStage(pack))); assert.equal(run.status, 'won');
  assert.ok(creatorLessonSteps(pack, { checked: true, won: true, shared: true }).every(step => step.done));
});
test('a creator tutorial exports a real adventure with a replayable winning proof', async () => {
  const pack = practiceClear(makeWorld(), routes.create), imported = parseAdventure(serializeAdventure(pack));
  assert.equal((await verifyAdventureProof(imported)).status, 'won');
  assert.equal(imported.title, 'Moonbeam Island'); assert.ok(imported.markers.find(marker => marker.kind === 'guide').text.includes('bridge'));
  await assert.rejects(verifyAdventureProof({ ...pack, proof: { difficulty: 'trail', actions: ['wait'] } }), /does not finish/);
});
test('practice painting is bounded, immutable, and cannot replace starting or exit objects', () => {
  const pack = practiceWorld('create'), before = JSON.stringify(pack);
  for (const point of [{ x: 2, y: 4 }, { x: -1, y: 4 }, { x: 10, y: 8 }]) assert.throws(() => paintPractice(pack, 'lantern', point), /marked practice spot/);
  const next = paintPractice(pack, 'bridge', { x: 5, y: 4 });
  assert.equal(JSON.stringify(pack), before); assert.equal(next.map.layers[0].tiles[45], 12);
  assert.deepEqual(next.markers, pack.markers);
});
test('editing removes old creator proofs and overlong attempts never inherit an earlier proof', () => {
  const pack = practiceClear(makeWorld(), routes.create);
  assert.equal(editAdventure(pack, { title: 'Another island' }).proof, undefined);
  assert.equal(practiceClear(pack, Array(2001).fill('wait')).proof, undefined);
});
test('training records use a separate bounded store and tolerate unavailable storage', () => {
  const entries = new Map([['tilewright.workshop.draft.v1', 'retain original'], ['tilewright.expedition.v1', 'retain checkpoint']]);
  const storage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
  assert.equal(saveTraining(storage, { play: true, create: false }), true); assert.deepEqual(readTraining(storage), { play: true, create: false });
  assert.equal(entries.get('tilewright.workshop.draft.v1'), 'retain original'); assert.equal(entries.get('tilewright.expedition.v1'), 'retain checkpoint');
  for (const raw of ['damaged', 'x'.repeat(1001), '{"version":2,"play":true}', '{"version":1,"play":"true"}']) { entries.set(TRAINING_KEY, raw); assert.deepEqual(readTraining(storage), { play: false, create: false }); }
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  assert.equal(saveTraining(blocked, { play: true }), false); assert.deepEqual(readTraining(blocked), { play: false, create: false });
});
test('each practice world is independent from other sessions', () => {
  const a = practiceWorld(), b = practiceWorld(); a.map.layers[0].tiles[12] = 3; a.markers[0].x = 8;
  assert.notEqual(a.map.layers[0].tiles[12], b.map.layers[0].tiles[12]); assert.equal(b.markers[0].x, 2);
});
