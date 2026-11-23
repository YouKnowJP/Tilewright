import test from 'node:test';
import assert from 'node:assert/strict';
import {PIP_POSTCARDS, featuredPostcard, postcardProgress} from '../src/pip-postcards.mjs';
import {
  editTinkerProject, newTinkerProject, solvedTinkerProject, startTinker, tinkerStep,
  clearTinkerProject, keepTinkerResult
} from '../src/pip-tinker.mjs';
import {loadPipStudio, savePipStudio} from '../src/pip-duo-storage.mjs';
import {pipAdventureCards} from '../src/pip-home-model.mjs';

const pick = date => featuredPostcard(Date.parse(date));
const freshJournal = () => loadPipStudio({getItem: () => null}).journal;

test('the postcard feature rotates on Monday UTC and cycles through the same three puzzles', () => {
  const [dawn, jade, brass] = PIP_POSTCARDS;
  assert.equal(pick('2026-11-23T00:00:00Z'), dawn);
  assert.equal(pick('2026-11-29T23:59:59Z'), dawn);
  assert.equal(pick('2026-11-30T00:00:00Z'), jade);
  assert.equal(pick('2026-12-07T00:00:00Z'), brass);
  assert.equal(pick('2026-12-14T00:00:00Z'), dawn);
  assert.equal(new Set(PIP_POSTCARDS.map(puzzle => puzzle.id)).size, 3);
});

test('postcard starters need a card edit and each authored route earns its stamp', () => {
  for (const puzzle of PIP_POSTCARDS) {
    let state = startTinker(newTinkerProject(puzzle.id));
    while (state.status === 'playing') state = tinkerStep(state);
    assert.equal(state.status, 'limit', puzzle.title);
    const clear = solvedTinkerProject(puzzle.id);
    assert.ok(clear.proof.ticks <= puzzle.stampTicks, puzzle.title);
  }
});

test('slower clears persist without stamps, and stamp progress stays separate from the main story', () => {
  const [dawn] = PIP_POSTCARDS;
  const initial = freshJournal();
  const scenario = editTinkerProject(newTinkerProject(dawn.id), {
    programs: [['use', 'right', 'wait'], ['right', 'wait', 'left']]
  });
  let state = startTinker(scenario);
  while (state.status === 'playing') state = tinkerStep(state);
  const slower = clearTinkerProject(state);
  let journal = keepTinkerResult(initial, slower);
  assert.deepEqual(postcardProgress(dawn, journal), {best: 15, stamped: false, saved: true});

  journal = keepTinkerResult(journal, solvedTinkerProject(dawn.id));
  journal = keepTinkerResult(journal, slower);
  const data = new Map();
  const storage = {getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value)};
  assert.ok(savePipStudio(storage, journal, slower.version));
  const loaded = loadPipStudio(storage);
  assert.equal(loaded.failed, false);
  assert.deepEqual(postcardProgress(dawn, loaded.journal), {best: 9, stamped: true, saved: true});
  assert.equal(loaded.journal.drafts[dawn.id].proof.ticks, 15);
  assert.deepEqual(pipAdventureCards(loaded.journal), pipAdventureCards(initial));
});
