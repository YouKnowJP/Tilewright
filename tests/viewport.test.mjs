import test from 'node:test';
import assert from 'node:assert/strict';
import { cellAtPoint, fitZoom } from '../src/viewport.mjs';
import { TILE_SIZE } from '../src/render.mjs';

test('fit zoom keeps the entire map inside phone, tablet, and desktop workspaces', () => {
  for (const [width, height] of [[28, 20], [64, 64], [1, 64], [64, 1], [1, 1]]) {
    for (const [availableWidth, availableHeight, padding] of [[290, 368, 32], [560, 447, 48], [897, 509, 48]]) {
      const scale = fitZoom(width, height, availableWidth, availableHeight, padding, padding);
      assert.ok(scale > 0 && scale <= 1);
      assert.ok(width * TILE_SIZE * scale + padding <= availableWidth);
      assert.ok(height * TILE_SIZE * scale + padding <= availableHeight);
    }
  }
});

test('fit zoom responds to a resized workspace and avoids enlarging tiny maps', () => {
  assert.ok(fitZoom(28, 20, 290, 368, 32, 32) < fitZoom(28, 20, 897, 509, 48, 48));
  assert.equal(fitZoom(1, 1, 897, 509, 48, 48), 1);
});

test('pointer hit testing uses displayed dimensions at every supported zoom', () => {
  for (const scale of [0.169, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]) {
    const bounds = { left: -117, top: -43, width: 28 * TILE_SIZE * scale, height: 20 * TILE_SIZE * scale };
    for (const [x, y] of [[0, 0], [27, 19], [13, 8]]) {
      assert.deepEqual(cellAtPoint(28, 20, bounds, bounds.left + (x + .5) * TILE_SIZE * scale,
        bounds.top + (y + .5) * TILE_SIZE * scale), { x, y });
    }
    assert.deepEqual(cellAtPoint(28, 20, bounds, bounds.left - 10, bounds.top - 10), { x: 0, y: 0 });
    assert.deepEqual(cellAtPoint(28, 20, bounds, bounds.left + bounds.width + 10, bounds.top + bounds.height + 10), { x: 27, y: 19 });
  }
});
