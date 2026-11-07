// New owned material. See LICENSE; prior MIT permissions remain effective.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {MEETING_HOUSE_MISSIONS} from '../src/pip-meeting-house.mjs';
import {meetingTurn} from '../src/pip-rendezvous.mjs';
import {newDuoProject, normalizeDuoProject, remixDuoProject, duoReadiness} from '../src/pip-duo.mjs';
import {startTinker, tinkerStep, tinkerStateKey, solvedTinkerProject, placeTinkerPart, parseTinkerProject, serializeTinkerProject, parseTinkerCode, tinkerCode} from '../src/pip-tinker.mjs';
import {duoBlueprint, configureDuoBlueprint, repeatDuoBlueprint, captureDuoBlueprint, placeDuoBlueprint, parseDuoBlueprint, serializeDuoBlueprint} from '../src/pip-duo-blueprints.mjs';
import {duoBlueprintLinks, rewireDuoBlueprint, unusedDuoBlueprintLinks} from '../src/pip-blueprint-links.mjs';
import {transformDuoGarden} from '../src/pip-garden-tools.mjs';
import {rehearseTinker, rehearsalAdvice} from '../src/pip-rehearsal.mjs';
import {duoHintStages} from '../src/pip-staged-hints.mjs';
import {normalizePipCollection, pipCollectionCode, parsePipCollectionCode, serializePipCollection, parsePipCollection} from '../src/pip-collections.mjs';
import {emptyCollectionJournal, keepCollection, captureCollectionChapter, replayCollectionSnapshot, normalizeCollectionJournal} from '../src/pip-collection-storage.mjs';
import {pipCollectionPoster} from '../src/pip-collection-poster.mjs';
import {UNSUPPORTED_DUO_VERSION, UNSUPPORTED_BLUEPRINT_VERSION} from '../scripts/browser/pip-format-boundaries.mjs';

const times = [12, 19, 21, 127];
const east = ['right', 'right', 'use'];
const post = (x, y, channel = 'amber') => ({kind: 'sync', x, y, channel});
const board = {width: 7, height: 5, road: Array.from({length: 35}, (_, i) => ({x: i % 7, y: Math.floor(i / 7)}))};
function project(parts, programs = [east, east], starts = [{x: 0, y: 1}, {x: 0, y: 3}]) {
  return normalizeDuoProject({format: 'pip-tinker-project', version: 18, trialId: 'duo-creator', board, starts, programs, parts});
}
function advance(state, ticks) {
  for (let i = 0; i < ticks; i++) state = tinkerStep(state);
  return state;
}
const finish = p => advance(startTinker(p), 240);

for (const [i, mission] of MEETING_HOUSE_MISSIONS.entries()) {
  test(`${mission.title} clears at turn ${times[i]} and supports alternate orientations`, () => {
    const p = solvedTinkerProject(mission.id);
    assert.equal(mission.chapter, 93 + i);
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

test('staggered arrivals hold cargo and cards until the next tick after both posts are occupied', () => {
  const p = solvedTinkerProject('duo-meeting-dusk');
  const state = advance(startTinker(p), 4);
  assert.deepEqual(state.bots.map(bot => [bot.syncing, bot.parcel, bot.index]), [[true, 'amber', 1], [false, 'blue', 1]]);
  const waiting = advance(state, 3);
  assert.deepEqual(waiting.bots.map(bot => bot.syncing), [true, true]);
  assert.equal(waiting.bots[0].x, 3);
  assert.equal(waiting.bots[0].index, 1);
  const altered = structuredClone(waiting);
  altered.bots[0].syncing = false;
  assert.notEqual(tinkerStateKey(altered), tinkerStateKey(waiting));
  const resumed = tinkerStep(waiting);
  assert.equal(resumed.ticks, meetingTurn(4, 7));
  assert.deepEqual(resumed.bots.map(bot => [bot.syncing, bot.x, bot.index]), [[false, 4, 2], [false, 3, 2]]);
  assert.equal(resumed.events.filter(event => event.includes('resumed together')).length, 2);
  assert.equal(tinkerStep(resumed).bots[1].syncing, false);
});

test('simultaneous arrivals release before either moves, and a blocked departure does not rearm', () => {
  const p = project([post(1, 1), post(2, 1)], [east, ['left', 'left', 'use']], [{x: 0, y: 1}, {x: 3, y: 1}]);
  const arrived = tinkerStep(startTinker(p));
  assert.ok(arrived.bots.every(bot => bot.syncing));
  const released = tinkerStep(arrived);
  assert.deepEqual(released.bots.map(bot => [bot.x, bot.syncing, bot.index]), [[1, false, 2], [2, false, 2]]);
  assert.ok(released.bots.every(bot => bot.last === 'Blocked'));
  assert.ok(tinkerStep(released).bots.every(bot => !bot.syncing));
});

test('different links wait, starting on a post does not queue, and rehearsal explains the stall', () => {
  const stations = [post(1, 1), post(2, 2), post(1, 3, 'jade'), post(4, 2, 'jade'),
    {kind: 'source', x: 4, y: 1, channel: 'blue'}, {kind: 'receiver', x: 5, y: 1, channel: 'blue'}];
  const p = project(stations);
  const trace = rehearseTinker(p, 24);
  assert.equal(trace.stop, 'repeat');
  assert.match(rehearsalAdvice(p, trace), /still waiting/);
  assert.equal(trace.events.filter(event => event.text.includes('resumed together')).length, 0);
  const start = project([post(0, 1), post(1, 3)], [['use', 'wait', 'right'], east]);
  assert.deepEqual(advance(startTinker(start), 2).bots.map(bot => bot.syncing), [false, true]);
});

test('rails can deliver a courier to a post and clocks keep running while it waits', () => {
  const p = project([
    {kind: 'rail', x: 1, y: 1, channel: 'amber', quietExit: 'right', poweredExit: 'right'},
    post(2, 1), post(3, 3), {kind: 'rest', x: 1, y: 3, duration: 2},
  ]);
  const arrived = advance(startTinker(p), 2);
  assert.deepEqual([arrived.bots[0].syncing, arrived.bots[0].index], [true, 1]);
  const resumed = advance(arrived, 5);
  assert.equal(resumed.ticks, 7);
  assert.deepEqual(resumed.bots.map(bot => bot.syncing), [false, false]);
  assert.equal(resumed.events.filter(event => event.includes('resumed together')).length, 2);
});

test('meeting previews count only the earlier courier’s extra turns', () => {
  for (let a = 1; a <= 16; a++) for (let b = 1; b <= 16; b++) assert.equal(meetingTurn(a, b) - 1, a > b ? a : b);
  for (const bad of [0, -1, '2', NaN, 2.5, Number.MAX_SAFE_INTEGER]) assert.throws(() => meetingTurn(bad, 1));
});

test('blueprint copies use distinct links, preserve cargo colours, and reject an overfull arrangement', () => {
  const original = duoBlueprint('meeting-lanes');
  const turned = configureDuoBlueprint(original, {turns: 1});
  const copies = repeatDuoBlueprint(turned, {count: 3, gap: 1});
  assert.deepEqual(duoBlueprintLinks(copies).map(link => [link.channel, link.ends]), [['amber', 2], ['jade', 2], ['violet', 2]]);
  assert.ok(copies.parts.filter(part => part.kind === 'source').every(part => part.channel === 'amber'));
  const posts = [post(0, 0), post(1, 0), post(0, 1, 'jade'), post(1, 1, 'jade')];
  const twoPairs = {...original, width: 2, height: 2, road: posts.map(({x, y}) => ({x, y})), parts: posts};
  assert.throws(() => repeatDuoBlueprint(twoPairs, {count: 3, gap: 0}), /more than four rendezvous links/);
  const garden = placeDuoBlueprint(newDuoProject('duo-creator', {width: 13, height: 9}), turned, 0, 0);
  const wired = rewireDuoBlueprint(turned, unusedDuoBlueprintLinks(garden, turned));
  assert.equal(duoBlueprintLinks(wired)[0].channel, 'jade');
  assert.equal(wired.parts.find(part => part.kind === 'source').channel, 'amber');
  const placed = placeDuoBlueprint(garden, wired, 4, 0);
  assert.deepEqual(captureDuoBlueprint(placed, {x: 4, y: 0, width: wired.width, height: wired.height}).parts, wired.parts);
  assert.deepEqual(parseDuoBlueprint(serializeDuoBlueprint(copies)), copies);
});

test('unfinished links may be edited, while extra posts and incompatible envelopes are refused', () => {
  const p = placeTinkerPart(newDuoProject(), 'sync', 2, 2, {channel: 'amber'});
  assert.equal(p.version, 18);
  assert.match(duoReadiness(p).errors.join(' '), /second amber Rendezvous Post/);
  const pair = placeTinkerPart(p, 'sync', 3, 2, {channel: 'amber'});
  assert.throws(() => placeTinkerPart(pair, 'sync', 4, 2, {channel: 'amber'}), /at most two/);
  assert.throws(() => captureDuoBlueprint(pair, {x: 2, y: 2, width: 1, height: 1}), /both Rendezvous/);
  for (const version of [17, UNSUPPORTED_DUO_VERSION]) assert.throws(() => parseTinkerProject(JSON.stringify({...p, version})));
  for (const version of [16, UNSUPPORTED_BLUEPRINT_VERSION]) assert.throws(() => parseDuoBlueprint(JSON.stringify({...duoBlueprint('meeting-lanes'), version})));
});

test('collection exchange and checkpoints restore waiting state and Undo', () => {
  const pack = normalizePipCollection({format: 'pip-adventure-collection', version: 1, name: 'The Meeting House', author: 'Moss', chapters: MEETING_HOUSE_MISSIONS.map(m => ({title: m.title, project: solvedTinkerProject(m.id)}))});
  for (const version of [1, 2]) {
    const p = normalizePipCollection({...pack, version});
    assert.deepEqual(parsePipCollectionCode(pipCollectionCode(p)), p);
    assert.deepEqual(parsePipCollection(serializePipCollection(p)), p);
  }
  assert.match(pipCollectionPoster(pack), /↔ Rendezvous Post/);
  const kept = keepCollection(emptyCollectionJournal(), pack), p = pack.chapters[0].project;
  const journal = captureCollectionChapter(kept.journal, kept.id, 0, {project: p, testing: true, ticks: 5});
  const restored = replayCollectionSnapshot(normalizeCollectionJournal(JSON.parse(JSON.stringify(journal))).records[0].states[0]);
  assert.deepEqual(restored.state, advance(startTinker(p), 5));
  assert.deepEqual(restored.state.bots.map(bot => bot.syncing), [true, false]);
  assert.deepEqual(tinkerStep(restored.history.at(-1)), restored.state);
});

test('v0.66 exports and recorded states retain a queued rail ride', async () => {
  const fixture = JSON.parse(await readFile(new URL('./fixtures/pip-v066-duo.json', import.meta.url), 'utf8'));
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
