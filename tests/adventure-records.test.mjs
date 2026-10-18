import test from 'node:test';
import assert from 'node:assert/strict';
import { RECORD_KEY, loadRecords, saveResult } from '../src/adventure-records.mjs';

const best = { stars: 3, turns: 54, score: 800 };
const storage = () => {
  const values = new Map([['tilewright.document.v1', 'editor map']]);
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};

test('adventure records persist independently of editor saves and discard unrecognized fields', () => {
  const store = storage();
  saveResult(store, {}, 'trail-1', { ...best, unexpected: 'discard' });
  assert.deepEqual(loadRecords(store), { 'trail-1': best });
  assert.equal(store.values.get('tilewright.document.v1'), 'editor map');
});

test('personal bests prioritize stars, score, and then fewer turns, without mutating previous records', () => {
  const store = storage(), records = { 'trail-1': best };
  assert.equal(saveResult(store, records, 'trail-1', { stars: 2, turns: 20, score: 900 }).improved, false);
  assert.equal(saveResult(store, records, 'trail-1', { ...best, score: 850 }).improved, true);
  assert.equal(saveResult(store, records, 'trail-1', { ...best, turns: 53 }).improved, true);
  assert.deepEqual(records, { 'trail-1': best });
  assert.equal(saveResult(store, {}, 'constructor', best).improved, true);
  assert.throws(() => saveResult(store, records, '../invalid', best), /identifier/);
});

test('invalid, oversized, future, and unavailable browser storage safely yield no records', () => {
  const store = storage();
  for (const value of ['{', 'x'.repeat(30_001), JSON.stringify({ version: 2, records: {} }),
    JSON.stringify({ version: 1, records: [] }), JSON.stringify({ version: 1, records: {
      'trail-1': { ...best, stars: 4 }, 'trail-2': { ...best, turns: -1 }, 'trail-3': { ...best, score: Infinity },
      'bad-id!': best, valid: best } })]) {
    store.setItem(RECORD_KEY, value);
    assert.deepEqual(loadRecords(store), value.includes('valid') ? { valid: best } : {});
  }
  const blocked = { getItem() { throw Error('denied'); }, setItem() { throw Error('quota'); } };
  assert.deepEqual(loadRecords(blocked), {});
  const result = saveResult(blocked, {}, 'trail-1', best);
  assert.equal(result.saved, false); assert.deepEqual(result.records['trail-1'], best);
});

test('custom expedition records are bounded without evicting campaign unlocks', () => {
  const store = storage(); let records = { 'trail-1': best, 'trail-2': best, 'trail-3': best };
  for (let i = 0; i < 100; i++) records = saveResult(store, records, `custom-${i}`, best).records;
  assert.equal(Object.keys(records).length, 64);
  assert.deepEqual(records['trail-1'], best); assert.deepEqual(records['trail-3'], best);
  assert.equal('custom-0' in records, false); assert.deepEqual(records['custom-99'], best);
  assert.deepEqual(loadRecords(store), records);
});
