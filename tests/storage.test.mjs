import test from 'node:test';
import assert from 'node:assert/strict';
import { createSample } from '../src/sample.mjs';
import { STORAGE_KEY, loadDocument, saveDocument } from '../src/storage.mjs';

test('local saving restores a map including layer visibility', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  assert.deepEqual(loadDocument(storage), { document: null, error: null });
  const map = createSample(); map.layers[1].visible = false;
  assert.equal(saveDocument(storage, map), true);
  assert.deepEqual(loadDocument(storage), { document: map, error: null });
  assert.ok(values.has(STORAGE_KEY));
});

test('corrupt saves are reported without overwriting the original', () => {
  const storage = { getItem: () => '{broken', setItem: () => { throw new Error('Must not write'); } };
  const result = loadDocument(storage);
  assert.equal(result.document, null); assert.match(result.error, /untouched/);
});

test('blocked storage and quota failures do not crash the editor', () => {
  const storage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
  assert.equal(loadDocument(storage).document, null);
  assert.equal(saveDocument(storage, createSample()), false);
});
