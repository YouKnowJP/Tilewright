import test from 'node:test';
import assert from 'node:assert/strict';
import { createDocument, paintCells, History, parseDocument, serializeDocument, validateDocument } from '../src/model.mjs';
import { ANCHORS, renameLayer, duplicateLayer, moveLayer, removeLayer, resizeDocument, croppedTileCount } from '../src/operations.mjs';

test('renaming validates printable names, preserves identity, and ignores no-op edits', () => {
  const map = createDocument('World', 2, 2);
  const renamed = renameLayer(map, 'details', ' Trees and cabins ');
  assert.equal(renamed.layers[1].name, 'Trees and cabins');
  assert.equal(renamed.layers[1].id, 'details');
  assert.equal(map.layers[1].name, 'Details');
  assert.equal(renameLayer(map, 'details', ' Details '), map);
  for (const name of ['', ' ', '\n', 'a'.repeat(33)]) assert.throws(() => renameLayer(map, 'details', name));
  assert.throws(() => renameLayer(map, 'missing', 'Layer'), /Unknown layer/);
});

test('a duplicate gets a unique ID, independent cells, bounded name, and immediate foreground placement', () => {
  const map = renameLayer(paintCells(createDocument('World', 2, 2), 'details', [{ x: 1, y: 1 }], 11), 'details', 'a'.repeat(32));
  const copied = duplicateLayer(map, 'details');
  assert.equal(copied.layers.length, 3);
  assert.notEqual(copied.layers[2].id, 'details');
  assert.equal(copied.layers[2].name.length, 32);
  assert.ok(copied.layers[2].name.endsWith(' copy'));
  assert.deepEqual(copied.layers[2].tiles, map.layers[1].tiles);
  copied.layers[2].tiles[3] = 7;
  assert.equal(map.layers[1].tiles[3], 11);
  const copiedAgain = duplicateLayer(copied, 'details');
  assert.equal(new Set(copiedAgain.layers.map(layer => layer.id)).size, 4);
  let full = copiedAgain;
  while (full.layers.length < 6) full = duplicateLayer(full, 'ground');
  assert.throws(() => duplicateLayer(full, 'ground'), /at most 6/);
});

test('layer movement follows compositing order and respects the front/back boundaries', () => {
  const map = createDocument('World', 2, 2);
  const raised = moveLayer(map, 'ground', 1);
  assert.deepEqual(raised.layers.map(layer => layer.id), ['details', 'ground']);
  assert.equal(moveLayer(raised, 'ground', 1), raised);
  assert.deepEqual(moveLayer(raised, 'ground', -1), map);
  assert.equal(moveLayer(map, 'ground', -1), map);
  assert.throws(() => moveLayer(map, 'ground', 2), /one position/);
});

test('deleting a layer is immutable and cannot remove the final layer', () => {
  const map = createDocument('World', 2, 2);
  const reduced = removeLayer(map, 'ground');
  assert.equal(reduced.layers[0].id, 'details');
  assert.equal(map.layers.length, 2);
  assert.throws(() => removeLayer(reduced, 'details'), /at least one/);
  assert.throws(() => removeLayer(map, 'missing'), /Unknown layer/);
});

test('all nine anchors retain content at the correct location when growing', () => {
  const map = paintCells(createDocument('Anchors', 2, 2), 'details', [{ x: 0, y: 0 }], 11);
  for (const [index, anchor] of ANCHORS.entries()) {
    const resized = resizeDocument(map, 4, 4, { anchor, fillTile: 4 });
    const x = index % 3, y = Math.floor(index / 3);
    assert.equal(resized.layers[1].tiles[y * 4 + x], 11, anchor);
    assert.equal(resized.layers[1].tiles.filter(tile => tile !== 0).length, 1, anchor);
    assert.equal(resized.layers[0].tiles.filter(tile => tile === 4).length, 12, anchor);
    assert.equal(croppedTileCount(map, 4, 4, anchor), 0);
    assert.equal(resized.layers[0].tiles[y * 4 + x], 1);
    assert.deepEqual(validateDocument(resized), resized);
  }
});

test('shrink preview counts discarded occupied cells across visible and hidden layers', () => {
  let map = createDocument('Crop', 3, 3);
  map = paintCells(map, 'details', [{ x: 0, y: 0 }, { x: 2, y: 2 }], 7);
  map.layers[1].visible = false;
  assert.equal(croppedTileCount(map, 2, 2, 'top-left'), 6);
  const cropped = resizeDocument(map, 2, 2, { anchor: 'top-left' });
  assert.deepEqual(cropped.layers[1].tiles, [7, 0, 0, 0]);
  assert.equal(cropped.layers[1].visible, false);
  const opposite = resizeDocument(map, 2, 2, { anchor: 'bottom-right' });
  assert.deepEqual(opposite.layers[1].tiles, [0, 0, 0, 7]);
  assert.equal(map.width, 3);
});

test('odd center offsets have a documented rounding rule and preserve empty original cells', () => {
  let map = createDocument('Centered', 3, 1);
  map = paintCells(map, 'ground', [{ x: 0, y: 0 }], 0);
  const grown = resizeDocument(map, 4, 1, { anchor: 'center', fillTile: 3 });
  assert.deepEqual(grown.layers[0].tiles, [0, 1, 1, 3]);
  const shrunk = resizeDocument(map, 2, 1, { anchor: 'center' });
  assert.deepEqual(shrunk.layers[0].tiles, [1, 1]);
});

test('resize rejects unsafe sizes/anchors/fills before allocating and handles maximum/minimum maps', () => {
  const map = createDocument('Bounds', 2, 2);
  for (const width of [0, 65, 1.5, NaN, Infinity, 1e9]) assert.throws(() => resizeDocument(map, width, 2), /dimensions/);
  assert.throws(() => resizeDocument(map, 2, 3, { anchor: 'outside' }), /anchor/);
  assert.throws(() => resizeDocument(map, 2, 3, { fillTile: 99 }), /fill/);
  assert.equal(resizeDocument(map, 2, 2), map);
  const large = resizeDocument(map, 64, 64);
  assert.equal(large.layers[0].tiles.length, 4096);
  assert.equal(resizeDocument(large, 1, 1).layers[0].tiles.length, 1);
});

test('every structural operation is a single undo step and survives version-1 JSON export', () => {
  const initial = createDocument('History', 3, 2), history = new History(initial);
  history.commit(renameLayer(history.document, 'details', 'Canopy'));
  history.commit(duplicateLayer(history.document, 'details'));
  history.commit(moveLayer(history.document, 'ground', 1));
  history.commit(removeLayer(history.document, 'details'));
  history.commit(resizeDocument(history.document, 6, 4, { anchor: 'center', fillTile: 4 }));
  const result = history.document;
  assert.deepEqual(parseDocument(serializeDocument(result)), result);
  for (let i = 0; i < 5; i++) assert.equal(history.undo(), true);
  assert.equal(history.document, initial);
  for (let i = 0; i < 5; i++) assert.equal(history.redo(), true);
  assert.equal(history.document, result);
});
