import test from 'node:test';
import assert from 'node:assert/strict';
import { createDocument, validateDocument, parseDocument, serializeDocument, paintCells, floodCells,
  lineCells, rectangleCells, History, MAX_FILE_BYTES, MAX_LAYERS } from '../src/model.mjs';
import { createSample } from '../src/sample.mjs';

test('a paint transaction is immutable, ignores outside cells, and leaves other layers alone', () => {
  const map = createDocument('Test', 3, 2);
  const next = paintCells(map, 'details', [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 3, y: 0 }], 7);
  assert.deepEqual(next.layers[1].tiles, [0, 7, 0, 0, 0, 0]);
  assert.deepEqual(map.layers[1].tiles, [0, 0, 0, 0, 0, 0]);
  assert.equal(next.layers[0], map.layers[0]);
  assert.equal(paintCells(next, 'details', [{ x: 1, y: 0 }], 7), next);
  assert.throws(() => paintCells(map, 'missing', [], 1), /layer/);
  assert.throws(() => paintCells(map, 'ground', [], -1), /tile/);
});

test('flood fill respects a separating boundary and uses four-way connectivity', () => {
  let map = createDocument('Fill', 5, 3);
  map = paintCells(map, 'ground', [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }], 3);
  const cells = floodCells(map, 'ground', 0, 0);
  assert.equal(cells.length, 6);
  const filled = paintCells(map, 'ground', cells, 4);
  assert.deepEqual(filled.layers[0].tiles, [4, 4, 3, 1, 1, 4, 4, 3, 1, 1, 4, 4, 3, 1, 1]);
  assert.deepEqual(floodCells(map, 'ground', -1, 0), []);
  const diagonal = paintCells(createDocument('Diagonal', 2, 2), 'ground', [{ x: 1, y: 0 }, { x: 0, y: 1 }], 3);
  assert.deepEqual(floodCells(diagonal, 'ground', 0, 0), [{ x: 0, y: 0 }]);
});

test('flood fill handles a maximum-sized map without recursive stack growth', () => {
  assert.equal(floodCells(createDocument('Large', 64, 64), 'ground', 0, 0).length, 4096);
});

test('brush interpolation has no gaps in every direction and includes both endpoints', () => {
  for (const end of [{ x: 8, y: 3 }, { x: 3, y: 8 }, { x: -8, y: 3 }, { x: 3, y: -8 }, { x: 0, y: 0 }]) {
    const cells = lineCells({ x: 0, y: 0 }, end);
    assert.deepEqual(cells[0], { x: 0, y: 0 }); assert.deepEqual(cells.at(-1), end);
    for (let i = 1; i < cells.length; i++) {
      assert.equal(Math.max(Math.abs(cells[i].x - cells[i - 1].x), Math.abs(cells[i].y - cells[i - 1].y)), 1);
    }
  }
});

test('rectangle fill includes reversed corners and single cells', () => {
  assert.equal(rectangleCells({ x: 4, y: 3 }, { x: 2, y: 1 }).length, 9);
  assert.deepEqual(rectangleCells({ x: 1, y: 1 }, { x: 1, y: 1 }), [{ x: 1, y: 1 }]);
});

test('a whole stroke is one undo step, redo is invalidated by a new edit, and history is bounded', () => {
  const initial = createDocument('Undo', 3, 2), history = new History(initial, 2);
  const next = paintCells(initial, 'ground', lineCells({ x: 0, y: 0 }, { x: 2, y: 0 }), 3);
  assert.equal(history.commit(next), true);
  assert.equal(history.commit(structuredClone(next)), false);
  assert.equal(history.undo(), true); assert.equal(history.document, initial);
  assert.equal(history.redo(), true); assert.equal(history.document, next);
  history.undo(); history.commit({ ...initial, name: 'Renamed' });
  assert.equal(history.redo(), false);
  history.commit({ ...history.document, name: 'Two' }); history.commit({ ...history.document, name: 'Three' });
  assert.equal(history.past.length, 2); history.undo(); history.undo();
  assert.equal(history.document.name, 'Renamed'); assert.equal(history.undo(), false);
});

test('JSON import/export preserves every layer, visibility, and original sample', () => {
  const map = createSample(); map.layers[1].visible = false;
  assert.deepEqual(parseDocument(serializeDocument(map)), map);
  assert.deepEqual(createSample(), createSample());
});

test('all maximum-sized maps exported by the editor fit within its import limit', () => {
  const map = createDocument('Maximum', 64, 64);
  while (map.layers.length < MAX_LAYERS) map.layers.push({ id: `layer-${map.layers.length}`, name: 'Layer', visible: true, tiles: Array(4096).fill(12) });
  const text = serializeDocument(map);
  assert.ok(new TextEncoder().encode(text).length < MAX_FILE_BYTES);
  assert.deepEqual(parseDocument(text), map);
});

test('malformed, oversized, future-version, and hostile maps are rejected before use', () => {
  assert.throws(() => parseDocument('{'), /JSON/);
  assert.throws(() => parseDocument(' '.repeat(MAX_FILE_BYTES + 1)), /1 MB/);
  for (const modify of [
    m => { m.version = 99; }, m => { m.width = 65; }, m => { m.height = 1.2; },
    m => { m.layers = []; }, m => { m.name = ' '; }, m => { m.name = 'bad\nname'; },
    m => { m.layers[0].tiles.pop(); }, m => { m.layers[0].tiles[0] = 99; },
    m => { m.layers[0].tiles[0] = '1'; }, m => { m.layers[0].visible = 'yes'; },
    m => { m.layers[1].id = m.layers[0].id; }, m => { m.layers[0].id = '../secrets'; },
    m => { delete m.layers[0].tiles[0]; }, m => { m.layers[0].name = '\u0000'; },
  ]) {
    const map = createDocument('Invalid', 2, 2); modify(map);
    assert.throws(() => validateDocument(map));
  }
  assert.throws(() => createDocument('Huge', 1e9, 1e9), /dimensions/);
});

test('import normalizes text, removes unknown metadata, and isolates source arrays', () => {
  const original = createDocument('Safe', 2, 2); original.name = ' Safe '; original.customer = 'discard';
  const clean = validateDocument(original);
  assert.equal(clean.name, 'Safe'); assert.equal('customer' in clean, false);
  clean.layers[0].tiles[0] = 3; assert.equal(original.layers[0].tiles[0], 1);
});
