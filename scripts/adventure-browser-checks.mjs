import { clickControl, selectControl, enterFirstTrail } from './ui-driver.mjs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const BASE = 'http://127.0.0.1:4174';
const editorKey = 'tilewright.document.v1', recordKey = 'tilewright.adventures.v1';
const arrow = { up: 'ArrowUp', right: 'ArrowRight', down: 'ArrowDown', left: 'ArrowLeft', wait: 'Space' };
async function playRoute(page, actions) {
  await page.locator('#adventure-canvas').evaluate(el => el.focus({ preventScroll: true }));
  for (const action of actions) await page.keyboard.press(arrow[action]);
}
async function openGame(page, baseURL) {
  await page.goto(`${baseURL}/#play`);
  await enterFirstTrail(page); await page.locator('#adventure[data-status="playing"]').waitFor();
  await page.waitForFunction(() => document.querySelector('#adventure-canvas').clientWidth > 0 && document.querySelector('#adventure-library').hidden);
}
async function assertLayout(page, width, controlsVisible = false) {
  const state = await page.evaluate(() => {
    const canvas = document.querySelector('#adventure-canvas').getBoundingClientRect();
    const viewport = document.querySelector('#game-viewport').getBoundingClientRect();
    const controls = document.querySelector('.game-controls').getBoundingClientRect();
    const dash = document.querySelector('#dash-button').getBoundingClientRect(), wait = document.querySelector('#game-wait').getBoundingClientRect();
    return { pageWidth: document.documentElement.scrollWidth, canvas: canvas.toJSON(), viewport: viewport.toJSON(),
      controls: controls.toJSON(), sameRow: Math.abs(dash.top - wait.top) < 1, height: innerHeight };
  });
  assert.equal(state.pageWidth, width, 'Adventure must not overflow sideways.');
  assert.ok(state.canvas.width > 0 && state.canvas.height > 0);
  assert.ok(state.canvas.left >= state.viewport.left && state.canvas.right <= state.viewport.right);
  assert.ok(state.canvas.top >= state.viewport.top && state.canvas.bottom <= state.viewport.bottom);
  assert.ok(state.sameRow, 'Dash and wait must remain beside the direction pad.');
  if (controlsVisible) assert.ok(state.controls.bottom <= state.height, 'Initial gameplay must bring touch controls into view.');
}

export async function checkAdventures(browserType, { baseURL = BASE, channel = 'chrome', routes } = {}) {
  routes ??= JSON.parse(await readFile(new URL('../tests/fixtures/adventure-routes.json', import.meta.url), 'utf8'));
  const browser = await browserType.launch({ headless: true, channel }), results = [];
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      try {
        const page = await context.newPage(), errors = [], failures = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', response => { if (response.status() >= 400) failures.push(response.url()); });
        await openGame(page, baseURL); await assertLayout(page, width, true);
        assert.equal(await page.locator('#editor').isVisible(), false);
        assert.equal(await page.locator('[data-stage="trail-2"]').isDisabled(), true);
        // An actual editor change gives us a saved document and undo step to protect.
        await clickControl(page, '#mode-create');
        await page.locator('#map-name').fill('Adventure test map'); await page.locator('#map-name').blur();
        const map = await page.evaluate(key => localStorage.getItem(key), editorKey);
        assert.ok(map?.includes('Adventure test map'));
        await clickControl(page, '#mode-play');
        await clickControl(page, '#game-hint-button');
        assert.ok(await page.locator('#game-hint').isVisible());
        assert.match(await page.locator('#game-hint-text').textContent(), /(?:lantern|key).*lies/);
        if (await page.locator('#game-notes-dialog').isVisible()) await page.locator('#game-notes-close').click();
        await clickControl(page, '#game-hint-button');
        await clickControl(page, '#game-pause');
        await playRoute(page, ['up']); assert.equal(await page.locator('#game-turns').textContent(), '0');
        await clickControl(page, '#game-primary');
        await page.locator('#adventure-canvas').evaluate(el => el.focus({ preventScroll: true }));
        await page.keyboard.press('Shift+ArrowUp');
        assert.equal(await page.locator('#game-turns').textContent(), '1');
        assert.equal(await page.locator('#game-energy').getAttribute('aria-label'), 'Energy: 1 of 3');
        await clickControl(page, '#game-wait');
        assert.equal(await page.locator('#game-energy').getAttribute('aria-label'), 'Energy: 2 of 3');
        await clickControl(page, '#game-restart');
        for (const [index, id] of ['trail-1', 'trail-2', 'trail-3'].entries()) {
          await playRoute(page, routes[id]);
          assert.equal(await page.locator('#adventure').getAttribute('data-status'), 'won', `${id} must finish through real keyboard input.`);
          assert.equal(await page.locator('#game-stars').textContent(), '★★★');
          assert.doesNotMatch(await page.locator('#game-status, #notes-quest').allTextContents().then(parts => parts.join(' ')), /[✓○✦]/);
          const records = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).records, recordKey);
          assert.equal(records[id].turns, routes[id].length); assert.equal(records[id].stars, 3);
          assert.equal(await page.evaluate(key => localStorage.getItem(key), editorKey), map);
          if (index < 2) {
            assert.equal(await page.locator(`[data-stage="trail-${index + 2}"]`).isDisabled(), false);
            await clickControl(page, '#game-primary');
          }
        }
        await page.reload(); await enterFirstTrail(page); await page.locator('#adventure[data-status="playing"]').waitFor();
        assert.equal(await page.locator('[data-stage="trail-3"]').isDisabled(), false);
        assert.match(await page.locator('[data-stage="trail-1"]').textContent(), /★★★/);
        await clickControl(page, '#play-custom');
        assert.equal(await page.locator('#game-title').textContent(), 'Adventure test map');
        assert.match(await page.locator('#game-subtitle').textContent(), /your map/);
        assert.equal(await page.evaluate(key => localStorage.getItem(key), editorKey), map);
        await clickControl(page, '#mode-create');
        assert.equal(await page.locator('#map-name').inputValue(), 'Adventure test map');
        // Reload intentionally clears in-memory undo; create and then protect another edit.
        await page.locator('#map-name').fill('Undo survives play'); await page.locator('#map-name').blur();
        await clickControl(page, '#mode-play'); await playRoute(page, ['right']); await clickControl(page, '#mode-create');
        await clickControl(page, '#undo'); assert.equal(await page.locator('#map-name').inputValue(), 'Adventure test map');
        await clickControl(page, '#new-map'); await page.locator('#new-width').fill('1'); await page.locator('#new-height').fill('1');
        page.once('dialog', dialog => dialog.accept()); await page.getByRole('button', { name: 'Create map', exact: true }).click();
        await clickControl(page, '#mode-play'); const title = await page.locator('#game-title').textContent();
        await clickControl(page, '#play-custom');
        assert.match(await page.locator('#game-status').textContent(), /six connected/);
        assert.equal(await page.locator('#game-title').textContent(), title);
        assert.deepEqual(errors, []); assert.deepEqual(failures, []);
        results.push({ width, checks: 'All three quests won with three stars; progression reload, dash, wait, pause, hints, custom map, unchanged editor save and undo, invalid tiny map.' });
      } finally { await context.close(); }
    }
    for (const width of [320, 768, 1024]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', hasTouch: true, isMobile: true });
      try {
        const page = await context.newPage(); await openGame(page, baseURL); await assertLayout(page, width, width === 320);
        const before = await page.locator('#game-turns').textContent();
        await clickControl(page, '[data-move="up"]', true);
        assert.equal(Number(await page.locator('#game-turns').textContent()), Number(before) + 1);
        await clickControl(page, '#game-restart');
        await page.locator('#adventure-canvas').scrollIntoViewIfNeeded();
        const box = await page.locator('#adventure-canvas').boundingBox(), cdp = await context.newCDPSession(page);
        const touch = (type, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: box.x + box.width / 2, y, id: 1 }] });
        await touch('touchStart', box.y + box.height / 2 + 35); await touch('touchMove', box.y + box.height / 2 - 35); await touch('touchEnd');
        assert.equal(await page.locator('#game-turns').textContent(), '1', 'A real touch swipe must move the explorer.');
        const current = await page.evaluate(() => scrollY);
        await page.locator('#adventure-canvas').evaluate(el => el.focus({ preventScroll: true }));
        await page.keyboard.press('ArrowUp'); assert.equal(await page.evaluate(() => scrollY), current, 'Arrow gameplay must not scroll the page.');
        results.push({ width, checks: 'Responsive canvas and controls, reduced motion, touch direction pad and real swipe, no arrow-key page jump.' });
      } finally { await context.close(); }
    }
    const context = await browser.newContext();
    try {
      await context.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw Error('Storage unavailable'); } }));
      const page = await context.newPage(); await openGame(page, baseURL); await playRoute(page, routes['trail-1']);
      assert.equal(await page.locator('#adventure').getAttribute('data-status'), 'won');
      assert.equal(await page.locator('[data-stage="trail-2"]').isDisabled(), false);
      assert.match(await page.locator('#game-save-note').textContent(), /unavailable/);
      results.push({ checks: 'Blocked browser storage still permits wins and session unlocks.' });
      await clickControl(page, '#mode-create'); await clickControl(page, '#new-map');
      await page.locator('#new-width').fill('64'); await page.locator('#new-height').fill('64');
      await page.getByRole('button', { name: 'Create map', exact: true }).click();
      await clickControl(page, '#mode-play'); await clickControl(page, '#play-custom');
      assert.match(await page.locator('#game-subtitle').textContent(), /your map/);
      await assertLayout(page, 1280);
      await playRoute(page, ['right', 'down']);
      assert.equal(await page.locator('#game-turns').textContent(), '2');
      results.push({ checks: 'Maximum 64 × 64 map generates reachable objectives and plays inside a bounded camera.' });
    } finally { await context.close(); }
    return { browser: browser.version(), results };
  } finally { await browser.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { chromium } = await import('playwright');
  console.log(JSON.stringify(await checkAdventures(chromium), null, 2));
}
