// New owned material. See LICENSE; prior MIT permissions remain effective.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {RAIL_HOUSE_MISSIONS} from '../src/pip-rail-house.mjs';
import {normalizeRail} from '../src/pip-rails.mjs';
import {newDuoProject, normalizeDuoProject, remixDuoProject, duoReadiness} from '../src/pip-duo.mjs';
import {startTinker, tinkerStep, tinkerStateKey, solvedTinkerProject, placeTinkerPart, parseTinkerProject, serializeTinkerProject, parseTinkerCode, tinkerCode} from '../src/pip-tinker.mjs';
import {duoBlueprint, configureDuoBlueprint, repeatDuoBlueprint, captureDuoBlueprint, placeDuoBlueprint, parseDuoBlueprint, serializeDuoBlueprint} from '../src/pip-duo-blueprints.mjs';
import {blueprintRailStations, tuneBlueprintRail, swapBlueprintRailExits, previewBlueprintRide} from '../src/pip-blueprint-rails.mjs';
import {rewireBlueprintPower} from '../src/pip-blueprint-power.mjs';
import {transformDuoGarden} from '../src/pip-garden-tools.mjs';
import {rehearseTinker} from '../src/pip-rehearsal.mjs';
import {duoHintStages} from '../src/pip-staged-hints.mjs';
import {normalizePipCollection, pipCollectionCode, parsePipCollectionCode, serializePipCollection, parsePipCollection} from '../src/pip-collections.mjs';
import {emptyCollectionJournal, keepCollection, captureCollectionChapter, replayCollectionSnapshot, normalizeCollectionJournal} from '../src/pip-collection-storage.mjs';
import {pipCollectionPoster} from '../src/pip-collection-poster.mjs';
import {UNSUPPORTED_DUO_VERSION, UNSUPPORTED_BLUEPRINT_VERSION} from '../scripts/browser/pip-format-boundaries.mjs';

const times = [11, 29, 11, 147];
const idle = ['wait', 'wait', 'wait'];
const east = ['right', 'right', 'use'];
const rail = (x, y, quietExit = 'right', poweredExit = 'down') => ({kind: 'rail', x, y, channel: 'amber', quietExit, poweredExit});
const board = {width: 7, height: 5, road: Array.from({length: 35}, (_, i) => ({x: i % 7, y: Math.floor(i / 7)}))};
function project(parts, programs = [east, idle], starts = [{x: 0, y: 2}, {x: 0, y: 4}]) {
  return normalizeDuoProject({format: 'pip-tinker-project', version: 17, trialId: 'duo-creator', board, starts, programs, parts});
}
function advance(state, ticks) {
  for (let i = 0; i < ticks; i++) state = tinkerStep(state);
  return state;
}
const finish = p => advance(startTinker(p), 240);

for (const [i, mission] of RAIL_HOUSE_MISSIONS.entries()) {
  test(`${mission.title} clears at turn ${times[i]} and supports alternate garden orientations`, () => {
    const p = solvedTinkerProject(mission.id);
    assert.equal(mission.chapter, 89 + i);
    assert.equal(p.proof.ticks, times[i]);
    assert.equal(duoReadiness(p).ready, true);
    assert.equal(rehearseTinker(p, 240).stop, 'won');
    assert.equal(new Set(duoHintStages(mission)).size, 3);
    assert.deepEqual(parseTinkerProject(serializeTinkerProject(p)), p);
    for (const operation of ['horizontal', 'vertical', 'palette']) {
      const result = finish(transformDuoGarden(remixDuoProject(p), operation));
      assert.equal(result.status, 'won');
      assert.equal(result.ticks, times[i]);
    }
  });
  test(`${mission.title} needs every loose part on its worked route`, () => {
    const {proof, ...p} = solvedTinkerProject(mission.id);
    for (const part of p.parts) assert.notEqual(finish({...p, parts: p.parts.filter(other => other !== part)}).status, 'won', JSON.stringify(part));
  });
}

test('a counter ring after Pip enters chooses the powered exit at departure and preserves cargo and cards', () => {
  const p = solvedTinkerProject('duo-rail-sidecar');
  const before = advance(startTinker(p), 3);
  let state = tinkerStep(before);
  assert.equal(before.bots[0].rolling, false);
  assert.deepEqual(state.bots[0], {...before.bots[0], x: 3, index: 1, rolling: true, last: 'Switch Rail reached · ride next turn'});
  const queued = tinkerStateKey(state);
  const unqueued = structuredClone(state);
  unqueued.bots[0].rolling = false;
  assert.notEqual(tinkerStateKey(unqueued), queued);
  state = tinkerStep(state);
  assert.deepEqual([state.bots[0].x, state.bots[0].y, state.bots[0].index, state.bots[0].rolling], [3, 2, 1, true]);
  assert.match(state.events.join(' '), /Powered South/);
  state = tinkerStep(state);
  assert.deepEqual([state.bots[0].x, state.bots[0].y, state.bots[0].index, state.bots[0].rolling, state.bots[0].parcel], [4, 2, 1, false, 'amber']);
  assert.equal(tinkerStep(state).bots[0].x, 5);
});

test('starting, waiting and using a rail do not queue a ride', () => {
  const p = project([rail(0, 2)], [['use', 'wait', 'right'], idle]);
  const state = advance(startTinker(p), 2);
  assert.equal(state.bots[0].x, 0);
  assert.equal(state.bots[0].index, 2);
  assert.equal(state.bots[0].rolling, false);
});

test('a blocked ride holds the card for one turn and disarms, using normal bridge and seal rules', () => {
  for (const obstacle of [{kind: 'bridge', channel: 'blue'}, {kind: 'seal', channel: 'jade', heading: 'right'}]) {
    const p = project([rail(1, 2), {...obstacle, x: 2, y: 2}]);
    const blocked = advance(startTinker(p), 2);
    assert.deepEqual([blocked.bots[0].x, blocked.bots[0].index, blocked.bots[0].rolling], [1, 1, false]);
    assert.match(blocked.bots[0].last, /Switch Rail blocked/);
    assert.equal(tinkerStep(blocked).bots[0].index, 2);
  }
  const occupied = project([rail(1, 2)], [east, idle], [{x: 0, y: 2}, {x: 2, y: 2}]);
  assert.match(advance(startTinker(occupied), 2).bots[0].last, /blocked/);
});

test('a rail arrival can mark a counter or start a rest, and a chain loop is detected', () => {
  const p = project([rail(1, 2), {kind: 'counter', x: 2, y: 2, channel: 'jade', threshold: 1}]);
  assert.deepEqual(advance(startTinker(p), 2).counters['1'], [0, 1]);
  const rest = project([rail(1, 2), {kind: 'rest', x: 2, y: 2, duration: 2}]);
  assert.equal(advance(startTinker(rest), 2).bots[0].resting, 2);
  assert.equal(advance(startTinker(rest), 4).bots[0].index, 1);
  const loop = project([rail(1, 2), rail(2, 2, 'left', 'left')]);
  const trace = rehearseTinker(loop, 24);
  assert.equal(trace.stop, 'repeat');
  assert.ok(trace.events.some(event => event.kind === 'rail' && /linked/.test(event.text)));
});

test('rail blueprint samples distinguish quiet and powered paths, loops, water and the edge', () => {
  const p = duoBlueprint('rail-fork');
  assert.deepEqual(previewBlueprintRide(p, 0).path, [{x: 1, y: 1}, {x: 2, y: 1}]);
  assert.deepEqual(previewBlueprintRide(p, 0, 'amber').path, [{x: 1, y: 1}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 2, y: 1}]);
  const loop = tuneBlueprintRail(p, 1, {quietExit: 'down', poweredExit: 'down'});
  assert.equal(previewBlueprintRide(loop, 0, 'amber').stop, 'loop');
  const water = tuneBlueprintRail(p, 1, {quietExit: 'left', poweredExit: 'left'});
  assert.equal(previewBlueprintRide(water, 0, 'amber').stop, 'water');
  const edge = tuneBlueprintRail(p, 1, {quietExit: 'up', poweredExit: 'up'});
  assert.equal(previewBlueprintRide(edge, 0, 'amber').stop, 'edge');
});

test('rail exit editing composes with independent wiring, rotation, copies and capture', () => {
  const p = duoBlueprint('rail-fork');
  const changed = tuneBlueprintRail(p, 0, {quietExit: 'down', poweredExit: 'left'}, {all: true});
  assert.deepEqual(blueprintRailStations(changed).map(x => x.quietExit), ['down', 'down', 'down']);
  assert.equal(p.parts[0].quietExit, 'right');
  const swapped = rewireBlueprintPower(swapBlueprintRailExits(changed), {amber: 'jade'});
  const arranged = repeatDuoBlueprint(configureDuoBlueprint(swapped, {turns: 1}), {count: 2, axis: 'right', gap: 1});
  assert.deepEqual(blueprintRailStations(arranged).map(x => [x.channel, x.quietExit, x.poweredExit]), Array.from({length: 6}, () => ['jade', 'up', 'left']));
  const garden = placeDuoBlueprint(newDuoProject('duo-creator', {width: 13, height: 9}), arranged, 1, 1);
  assert.deepEqual(captureDuoBlueprint(garden, {x: 1, y: 1, width: arranged.width, height: arranged.height}).parts, arranged.parts);
  assert.deepEqual(parseDuoBlueprint(serializeDuoBlueprint(arranged)), arranged);
});

test('rail version boundaries reject old and unknown envelopes and malformed directions', () => {
  const p = placeTinkerPart(newDuoProject(), 'rail', 2, 2, {channel: 'amber'});
  assert.equal(p.version, 17);
  for (const version of [16, UNSUPPORTED_DUO_VERSION]) assert.throws(() => parseTinkerProject(JSON.stringify({...p, version})));
  for (const version of [15, UNSUPPORTED_BLUEPRINT_VERSION]) assert.throws(() => parseDuoBlueprint(JSON.stringify({...duoBlueprint('rail-corner'), version})));
  for (const quietExit of ['wait', 'use', 'constructor', ['right'], null]) assert.throws(() => normalizeRail({channel: 'amber', quietExit}));
});

test('collection exchange and checkpoint restore both queued rides and Undo history', () => {
  const pack = normalizePipCollection({format: 'pip-adventure-collection', version: 1, name: 'The Switchyard', author: 'Tavi', chapters: RAIL_HOUSE_MISSIONS.map(m => ({title: m.title, project: solvedTinkerProject(m.id)}))});
  for (const version of [1, 2]) {
    const p = normalizePipCollection({...pack, version});
    assert.deepEqual(parsePipCollectionCode(pipCollectionCode(p)), p);
    assert.deepEqual(parsePipCollection(serializePipCollection(p)), p);
  }
  assert.match(pipCollectionPoster(pack), /» Switch Rail/);
  const kept = keepCollection(emptyCollectionJournal(), pack), p = pack.chapters[0].project;
  const journal = captureCollectionChapter(kept.journal, kept.id, 0, {project: p, testing: true, ticks: 5});
  const restored = replayCollectionSnapshot(normalizeCollectionJournal(JSON.parse(JSON.stringify(journal))).records[0].states[0]);
  assert.deepEqual(restored.state, advance(startTinker(p), 5));
  assert.equal(restored.state.bots[0].rolling, true);
  assert.deepEqual(tinkerStep(restored.history.at(-1)), restored.state);
});

test('v0.65 save and export bytes are unchanged, including a live counter pulse', async () => {
  const fixture = JSON.parse(await readFile(new URL('./fixtures/pip-v065-duo.json', import.meta.url), 'utf8'));
  const p = parseTinkerProject(fixture.project);
  assert.equal(serializeTinkerProject(p), fixture.project);
  assert.equal(tinkerCode(parseTinkerCode(fixture.code)), fixture.code);
  assert.equal(serializeDuoBlueprint(parseDuoBlueprint(fixture.piece)), fixture.piece);
  for (const [name, code] of [['collection', 'collectionCode'], ['bonus', 'bonusCode']]) {
    assert.equal(serializePipCollection(parsePipCollection(fixture[name])), fixture[name]);
    assert.equal(pipCollectionCode(parsePipCollectionCode(fixture[code])), fixture[code]);
  }
  let state = startTinker(p);
  for (const frame of fixture.frames) {
    state = advance(state, frame.tick - state.ticks);
    assert.equal(tinkerStateKey(state), frame.key);
  }
  assert.equal(state.status, 'won');
});
