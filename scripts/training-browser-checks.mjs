import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { enterFirstTrail } from './ui-driver.mjs';
import { parseAdventure } from '../src/workshop-sharing.mjs';
import { verifyAdventureProof, blankAdventure } from '../src/workshop-model.mjs';

const savedKeys = ['tilewright.trail.checkpoint.v1', 'tilewright.document.v1', 'tilewright.adventures.v1', 'tilewright.expedition.v1', 'tilewright.tactics.v1', 'tilewright.guild.v1', 'tilewright.workshop.draft.v1', 'tilewright.workshop.v1'];
const saves = page => page.evaluate(keys => keys.map(key => localStorage.getItem(key)), savedKeys);
const keys = { up: 'ArrowUp', right: 'ArrowRight', down: 'ArrowDown', left: 'ArrowLeft', wait: 'Space' };
export { walk as playTraining, createWorld as buildTrainingWorld };
async function walk(page, actions, touch = false) {
  for (const action of actions) {
    if (action === 'close-dialogue') await page.locator('#training-talk-close').click();
    else if (action.startsWith('interact:')) {
      if (await page.locator('#training-target').isVisible()) await page.locator('#training-target').selectOption(action.slice(9));
      await page.locator('#training-interact').click();
    } else if (touch) await page.locator(action === 'wait' ? '#training-wait' : `[data-training-move="${action}"]`).tap();
    else { await page.locator('#training-map').focus(); await page.keyboard.press(keys[action]); }
  }
}
async function paint(page, brush, x, y, touch) {
  await page.locator(`[data-training-brush="${brush}"]`).click();
  if (!touch) { await page.keyboard.press('Space'); return; }
  const canvas = page.locator('#training-map'); await canvas.scrollIntoViewIfNeeded(); const r = await canvas.boundingBox();
  await page.touchscreen.tap(r.x + (x + .5) * r.width / 10, r.y + (y + .5) * r.height / 8);
}
async function createWorld(page, route, touch) {
  await page.locator('[data-training-lesson="create"]').click();
  await page.locator('#training-check').click(); assert.match(await page.locator('#training-check-report').textContent(), /lantern/i);
  assert.equal(await page.locator('#training-test').isDisabled(), true);
  await paint(page, 'bridge', 5, 4, touch); await page.locator('#training-undo').click();
  assert.match(await page.locator('#training-goal').textContent(), /crossing/i); await page.locator('#training-redo').click();
  await paint(page, 'lantern', 7, 3, touch); await paint(page, 'guide', 3, 3, touch);
  assert.equal(await page.locator('#training-story').getAttribute('open'), '');
  await page.locator('#training-keeper-lines').fill('A hint for my first island.');
  await page.locator('#training-story-form button').click(); assert.match(await page.locator('#training-message').textContent(), /Make it yours/);
  await page.locator('#training-world-title').fill('Moonbeam Island'); await page.locator('#training-opening').fill('A little light is waiting beyond the river.');
  await page.locator('#training-keeper-lines').fill('Take the bridge, restore the lantern, and return to the beacon.');
  await page.keyboard.press('ArrowDown'); assert.equal(await page.locator('#training-world-title').inputValue(), 'Moonbeam Island');
  await page.locator('#training-story-form button').click(); await page.locator('#training-check').click();
  assert.match(await page.locator('#training-check-report').textContent(), /passed/);
  await page.locator('#training-test').click(); await walk(page, route, touch);
  assert.match(await page.locator('#training-map').getAttribute('aria-label'), /won/);
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#training-download').click()]);
  const chunks = []; for await (const part of await download.createReadStream()) chunks.push(part);
  const pack = parseAdventure(Buffer.concat(chunks).toString('utf8'));
  assert.equal(pack.title, 'Moonbeam Island'); assert.equal((await verifyAdventureProof(pack)).status, 'won');
  assert.equal(await page.locator('#training-step-count').textContent(), 'LESSON COMPLETE');
  return pack;
}
export async function checkTraining(browserType, { baseURL = 'http://127.0.0.1:4174', channel = 'chrome', screenshots = false, widths = [1440, 390, 320, 768, 1024, 844], onProgress = () => {} } = {}) {
  const routes = JSON.parse(await readFile(new URL('../tests/fixtures/training-routes.json', import.meta.url), 'utf8'));
  const browser = await browserType.launch({ headless: true, channel }), results = [];
  try {
    for (const width of widths) {
      const height = width === 844 ? 390 : 900, context = await browser.newContext({ viewport: { width, height }, hasTouch: width <= 1000, reducedMotion: 'reduce', acceptDownloads: true });
      try {
        const page = await context.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()}: ${r.url()}`); });
        await page.goto(baseURL); await page.locator('#game-title-screen').waitFor(); await page.locator('#startup-status').waitFor({ state: 'hidden' });
        assert.equal(await page.locator('#editor').isVisible(), false); assert.equal(await page.locator('a[href*="github.com"]').count(), 0);
        await enterFirstTrail(page); await page.locator('#adventure-canvas').focus(); await page.keyboard.press('ArrowUp');
        const position = await page.locator('#adventure-canvas').getAttribute('aria-label');
        await page.locator('#game-home').click(); const before = await saves(page);
        await page.locator('#title-training').click(); if (screenshots && width === 1440) await page.screenshot({ path: '.playwright-mcp/training-camp-1440.png', fullPage: true });
        await page.locator('[data-training-lesson="play"]').click();
        await page.locator('#training-hint').click(); assert.equal(await page.locator('#training-hint-copy').isVisible(), true);
        await page.locator('#training-plan').click(); const planPosition = await page.locator('#training-map').getAttribute('aria-label');
        await page.keyboard.press('ArrowUp'); assert.equal(await page.locator('#training-map').getAttribute('aria-label'), planPosition); await page.keyboard.press('Escape');
        if (screenshots && [390, 1440].includes(width)) await page.screenshot({ path: `.playwright-mcp/training-play-${width}.png`, fullPage: true });
        await walk(page, routes.play, width <= 1000);
        assert.equal(await page.locator('#training-step-count').textContent(), 'LESSON COMPLETE'); assert.deepEqual(await saves(page), before);
        await page.locator('#training-home').click(); await page.locator('#title-continue').click(); assert.equal(await page.locator('#adventure-canvas').getAttribute('aria-label'), position);
        await page.locator('#game-home').click(); await page.locator('#title-training').click();
        if ([1440, 390].includes(width)) {
          await createWorld(page, routes.create, width === 390); assert.deepEqual(await saves(page), before);
          if (screenshots) await page.screenshot({ path: `.playwright-mcp/training-created-${width}.png`, fullPage: true });
          await page.locator('#training-edit').click(); await paint(page, 'lantern', 7, 3, width === 390);
          assert.equal(await page.locator('#training-keep').isVisible(), false); assert.equal(await page.locator('#training-test').isDisabled(), true);
          await page.locator('#training-lessons').click();
        }
        assert.match(await page.locator('#training-play-record').textContent(), /complete/);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
        await page.locator('#training-home').click(); await page.reload(); await page.locator('#title-training').click(); assert.match(await page.locator('#training-play-record').textContent(), /complete/);
        assert.deepEqual(errors, []);
        const result = { width, height, checks: 'Root opens title; native lesson win; Plan/dialogue pause; exact Continue and saves preserved; lesson records survive reload; no overflow', creator: [1440, 390].includes(width) ? 'Native building, history, story, checks, actual win, proof export, editing invalidates clear' : 'Responsive lesson' };
        results.push(result); onProgress(result);
      } finally { await context.close(); }
    }
    // A player explicitly decides whether the practice world may replace an
    // existing draft. Cancelling must retain both the lesson and original draft.
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
    try {
      const draft = blankAdventure(); draft.title = 'Keep my original draft';
      await context.addInitScript(pack => localStorage.setItem('tilewright.workshop.draft.v1', JSON.stringify(pack)), draft);
      const page = await context.newPage(); await page.goto(baseURL); await page.locator('#title-training').click();
      const before = await page.evaluate(() => localStorage.getItem('tilewright.workshop.draft.v1'));
      await createWorld(page, routes.create, false);
      page.once('dialog', dialog => dialog.dismiss()); await page.locator('#training-workshop').click();
      assert.equal(await page.locator('#training-camp').isVisible(), true); assert.equal(await page.evaluate(() => localStorage.getItem('tilewright.workshop.draft.v1')), before);
      page.once('dialog', dialog => dialog.accept()); await page.locator('#training-workshop').click();
      await page.locator('#ws-build').waitFor(); assert.equal(await page.locator('#ws-title').inputValue(), 'Moonbeam Island');
      assert.ok(JSON.parse(await page.evaluate(() => localStorage.getItem('tilewright.workshop.draft.v1'))).proof);
      results.push({ checks: 'Workshop transfer respects cancelled replacement, then explicitly imports the actual created world and winning clear.' });
    } finally { await context.close(); }
    const blocked = await browser.newContext();
    try {
      await blocked.addInitScript(() => { Storage.prototype.setItem = () => { throw Error('Saving unavailable'); }; });
      const page = await blocked.newPage(); await page.goto(baseURL); await page.locator('#title-training').click(); await page.locator('[data-training-lesson="play"]').click();
      await walk(page, routes.play); await page.locator('#training-lessons').click(); assert.match(await page.locator('#training-save-note').textContent(), /unavailable/);
      results.push({ checks: 'Unavailable saving still permits a complete lesson and reports that completion is session-only.' });
    } finally { await blocked.close(); }
    return { browser: browser.version(), results };
  } finally { await browser.close(); }
}
