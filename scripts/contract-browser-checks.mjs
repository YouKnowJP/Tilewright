import { clickControl, selectControl } from './ui-driver.mjs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
const BASE = 'http://127.0.0.1:4174';
const memoryKey = 'tilewright.tactics.v1', recordKey = 'tilewright.adventures.v1';
const keys = { up: 'ArrowUp', right: 'ArrowRight', down: 'ArrowDown', left: 'ArrowLeft', wait: 'Space', shield: 'c', decoy: 'q' };
async function playContract(page, actions) {
  await page.locator('#adventure-canvas').evaluate(el => el.focus({ preventScroll: true }));
  for (const action of actions) {
    if (action.startsWith('interact:')) await page.keyboard.press('e');
    else if (action.startsWith('choose:')) await clickControl(page, `[data-choice="${action.slice(7)}"]`);
    else if (action === 'close-dialogue') await clickControl(page, '#conversation-close');
    else if (action.startsWith('dash-')) await page.keyboard.press(`Shift+${keys[action.slice(5)]}`);
    else await page.keyboard.press(keys[action]);
  }
}
export async function checkContracts(browserType, { baseURL = BASE, channel = 'chrome', routes, nemesisRoutes } = {}) {
  routes ??= JSON.parse(await readFile(new URL('../tests/fixtures/contract-routes.json', import.meta.url), 'utf8'));
  nemesisRoutes ??= JSON.parse(await readFile(new URL('../tests/fixtures/nemesis-routes.json', import.meta.url), 'utf8'));
  const browser = await browserType.launch({ headless: true, channel }), results = [];
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      try {
        const page = await context.newPage(), errors = [], failures = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', response => { if (response.status() >= 400) failures.push(response.url()); });
        await page.goto(`${baseURL}/#play`); await page.locator('#adventure[data-status="playing"]').waitFor();
        assert.equal(await page.locator('[data-stage="trail-4"]').isDisabled(), false, 'Hard missions must be available without repeating the introductory act.');
        await clickControl(page, '#begin-contracts');
        // Dialogue stops game time, has real choices, and cannot be farmed.
        await clickControl(page, '#game-interact');
        assert.equal(await page.locator('#conversation-name').textContent(), 'Nia');
        assert.equal(await page.locator('#conversation-dialog').isVisible(), true);
        await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
        await page.keyboard.press('ArrowRight'); assert.equal(await page.locator('#game-turns').textContent(), '0');
        await clickControl(page, '[data-choice="decoy"]');
        assert.equal(await page.locator('#game-decoys').textContent(), '3');
        assert.match(await page.locator('#game-journal').textContent(), /false trail/);
        await clickControl(page, '#conversation-close');
        await clickControl(page, '#game-interact'); assert.equal(await page.locator('[data-choice]').count(), 0);
        await page.keyboard.press('Escape'); assert.equal(await page.locator('#conversation-dialog').isVisible(), false);
        await clickControl(page, '#dash-button'); await clickControl(page, '#game-decoy');
        assert.equal(await page.locator('#game-decoys').textContent(), '2', 'Armed dash must not swallow tactical actions.');
        assert.equal(await page.locator('#game-turns').textContent(), '1');
        await clickControl(page, '#game-shield'); assert.match(await page.locator('#game-shield').getAttribute('aria-label'), /3 protected turns/);
        await clickControl(page, '#game-restart');
        const map = await page.evaluate(() => localStorage.getItem('tilewright.document.v1'));
        for (const [index, id] of ['trail-4', 'trail-5', 'trail-6'].entries()) {
          if (index) { await clickControl(page, '#forget-habits'); await clickControl(page, '#game-primary'); }
          await playContract(page, routes[id]);
          assert.equal(await page.locator('#adventure').getAttribute('data-status'), 'won', `Complete ${id} with real keyboard actions and dialogue choices.`);
          assert.equal(await page.locator('#game-stars').textContent(), '★★★');
          assert.equal(await page.locator('#quest-mission').textContent().then(text => text.includes('○')), false);
          assert.equal(await page.evaluate(() => localStorage.getItem('tilewright.document.v1')), map);
          const data = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), memoryKey);
          assert.ok(data.memory.observations > 30);
          if (id === 'trail-6') assert.match(await page.locator('#game-result-title').textContent(), /Watcher falls silent/);
        }
        await clickControl(page, '#game-nemesis');
        assert.equal(await page.locator('#game-title').textContent(), 'Briarwatch Rescue');
        assert.equal(await page.locator('#game-difficulty').inputValue(), 'nemesis');
        const learned = await page.evaluate(key => localStorage.getItem(key), memoryKey);
        await page.reload(); await page.locator('#adventure[data-status="playing"]').waitFor();
        assert.equal(await page.evaluate(key => localStorage.getItem(key), memoryKey), learned, 'Learning survives a reload without losing best scores.');
        assert.equal(await page.locator('[data-stage="trail-6"]').isDisabled(), false);
        await selectControl(page, '#game-difficulty', 'nemesis');
        assert.equal(await page.locator('#game-health').getAttribute('aria-label'), 'Health: 2 of 3');
        assert.equal(await page.locator('#game-shields').textContent(), '1');
        assert.match(await page.locator('#game-subtitle').textContent(), /NEMESIS/);
        await clickControl(page, '#forget-habits');
        assert.match(await page.locator('#game-learning').textContent(), /0 moves learned/);
        const records = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).records, recordKey);
        assert.equal(records['trail-6'].stars, 3); assert.equal(records['trail-6-nemesis'], undefined);
        await clickControl(page, '[data-stage="trail-6"]');
        await playContract(page, nemesisRoutes['trail-6']);
        assert.equal(await page.locator('#adventure').getAttribute('data-status'), 'won');
        assert.equal(await page.locator('#game-stars').textContent(), '★★★');
        const afterHard = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).records, recordKey);
        assert.equal(afterHard['trail-6-nemesis'].turns, 104); assert.equal(afterHard['trail-6'].turns, 97);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
        assert.deepEqual(errors, []); assert.deepEqual(failures, []);
        results.push({ width, checks: 'Three hard contracts won through real input, rescue and relay goals, dialogue/choices/journal, tactical buttons, memory reload/reset, Nemesis finale completed with three stars and a separate best, unchanged editor.' });
      } finally { await context.close(); }
    }
    const context = await browser.newContext({ viewport: { width: 320, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
    try {
      const page = await context.newPage(); await page.goto(`${baseURL}/#play`); await page.locator('#adventure[data-status="playing"]').waitFor();
      await clickControl(page, '#begin-contracts', true); await clickControl(page, '#game-interact', true);
      const dialog = await page.locator('#conversation-dialog').boundingBox();
      assert.ok(dialog.x >= 0 && dialog.x + dialog.width <= 320 && dialog.y >= 0 && dialog.y + dialog.height <= 844);
      await clickControl(page, '[data-choice="shield"]', true); await clickControl(page, '#conversation-close', true);
      await page.locator('.game-main').evaluate(el => el.scrollIntoView({ block: 'start' }));
      const geometry = await page.locator('.tactical-actions').boundingBox();
      assert.ok(geometry.y + geometry.height <= 844, 'Tactical controls must remain in view on a narrow phone.');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
      await clickControl(page, '#game-decoy', true); await clickControl(page, '#game-shield', true);
      assert.equal(await page.locator('#game-turns').textContent(), '2');
      results.push({ width: 320, checks: 'Touch dialogue and loadout choice, bounded modal, visible tactical controls, reduced motion, real decoy and shield actions.' });
    } finally { await context.close(); }
    return { browser: browser.version(), results };
  } finally { await browser.close(); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { chromium } = await import('playwright');
  console.log(JSON.stringify(await checkContracts(chromium), null, 2));
}
