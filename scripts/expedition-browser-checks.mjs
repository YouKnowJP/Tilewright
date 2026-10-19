import { clickControl, selectControl } from './ui-driver.mjs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
const BASE = 'http://127.0.0.1:4174';
const checkpointKey = 'tilewright.expedition.v1', logbookKey = 'tilewright.logbook.v1';
const arrows = { up: 'ArrowUp', right: 'ArrowRight', down: 'ArrowDown', left: 'ArrowLeft' };
const snapshot = page => page.evaluate(key => localStorage.getItem(key), checkpointKey);
async function hub(page) { await clickControl(page, '#begin-expedition'); }
async function begin(page, config) {
  await hub(page); await selectControl(page, '#expedition-mode', config.mode || 'journey');
  if (config.mode !== 'daily') {
    await page.locator('#expedition-seed').fill(config.seed);
    if (config.mode !== 'contract') await selectControl(page, '#expedition-length', String(config.length || 6));
    await selectControl(page, '#expedition-difficulty', config.difficulty || 'trail');
    await selectControl(page, '#expedition-vow', config.vow || 'none');
  }
  const suspended = await snapshot(page);
  if (suspended && JSON.parse(suspended).state.phase !== 'won') page.once('dialog', dialog => dialog.accept());
  await clickControl(page, '#expedition-start');
  await page.locator('#game-expedition-banner').waitFor();
}
async function input(page, action) {
  if (action.startsWith('interact:')) await page.keyboard.press('e');
  else if (action.startsWith('choose:')) await clickControl(page, `[data-choice="${action.slice(7)}"]`);
  else if (action === 'close-dialogue') await clickControl(page, '#conversation-close');
  else if (action.startsWith('dash-')) await page.keyboard.press(`Shift+${arrows[action.slice(5)]}`);
  else await page.keyboard.press(arrows[action] || { wait: 'Space', decoy: 'q', shield: 'c', 'drop-cargo': 'x' }[action]);
}
async function replay(page, actions) {
  await page.locator('#adventure-canvas').focus();
  for (const action of actions) await input(page, action);
}
async function resume(page) {
  await hub(page); await clickControl(page, '#expedition-resume');
  await page.waitForFunction(() => !document.querySelector('#expedition-resume').disabled && !document.querySelector('#game-expedition-banner').hidden);
}
function compareCheckpoint(a, b) {
  const first = JSON.parse(a), second = JSON.parse(b);
  assert.equal(second.fingerprint, first.fingerprint); assert.deepEqual(second.state, first.state);
}
export async function checkExpeditions(browserType, { baseURL = BASE, channel = 'chrome', fixtures, screenshots = false } = {}) {
  fixtures ??= JSON.parse(await readFile(new URL('../tests/fixtures/expedition-routes.json', import.meta.url), 'utf8'));
  const browser = await browserType.launch({ headless: true, channel }), results = [];
  try {
    // Each context is disposable: the user's actual saves are never reset.
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    try {
      const page = await context.newPage(), errors = [], failures = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('response', response => { if (response.status() >= 400) failures.push(response.url()); });
      await page.clock.setFixedTime(new Date('2026-10-18T12:00:00Z'));
      await page.goto(`${baseURL}/#play`); await page.locator('#adventure[data-status="playing"]').waitFor();
      const retained = await page.evaluate(() => Object.fromEntries(['tilewright.document.v1', 'tilewright.adventures.v1', 'tilewright.tactics.v1'].map(key => [key, localStorage.getItem(key)])));
      let count = 0;
      for (const mode of ['journey', 'contract']) for (const difficulty of ['trail', 'nemesis']) for (const vow of ['none', 'treasure', 'quiet', 'unwarded']) for (const length of mode === 'journey' ? [3, 6, 9] : [1]) {
        await begin(page, { mode, seed: `options-${count}`, length, difficulty, vow });
        const state = JSON.parse(await snapshot(page)).state;
        assert.deepEqual(state.config, { mode, seed: `options-${count}`, length, difficulty, vow });
        assert.equal(await page.locator('#game-difficulty').isDisabled(), true);
        assert.equal(await page.locator('#dash-button').isDisabled(), vow === 'quiet');
        assert.equal(await page.locator('#game-shield').isDisabled(), vow === 'unwarded'); count++;
      }
      await hub(page); await page.locator('#expedition-seed').fill('saved-custom-seed');
      await selectControl(page, '#expedition-mode', 'daily');
      for (const id of ['length', 'difficulty', 'vow', 'surprise']) assert.equal(await page.locator(`#expedition-${id}`).isDisabled(), true);
      assert.equal(await page.locator('#expedition-seed').getAttribute('readonly'), '');
      await begin(page, { mode: 'daily' });
      assert.deepEqual(JSON.parse(await snapshot(page)).state.config, { mode: 'daily', seed: 'daily-2026-10-18', length: 5, difficulty: 'trail', vow: 'none' });
      await hub(page); await selectControl(page, '#expedition-mode', 'contract');
      assert.equal(await page.locator('#expedition-seed').inputValue(), 'saved-custom-seed');
      assert.equal(await page.locator('#expedition-difficulty').inputValue(), 'nemesis');
      await clickControl(page, '#expedition-surprise'); assert.match(await page.locator('#expedition-seed').inputValue(), /^trail-/);
      await page.locator('#expedition-seed').fill('bad<script>'); await clickControl(page, '#expedition-start');
      assert.equal(await page.locator('#expedition-seed').evaluate(el => el.validity.patternMismatch), true);
      const saved = await snapshot(page); await page.locator('#expedition-seed').fill('cancel-replacement');
      page.once('dialog', dialog => dialog.dismiss()); await clickControl(page, '#expedition-start'); compareCheckpoint(saved, await snapshot(page));
      assert.deepEqual(errors, []); assert.deepEqual(failures, []);
      results.push({ checks: `${count + 1} form configurations, daily UTC/fixed rules/custom-settings return, surprise seed, invalid seed, replacement cancellation, no runtime/asset/console errors.` });
      // Long runs use only keyboard, real conversation choices, and camp forms.
      for (const id of ['long-voyage', 'nemesis-journey', 'daily-trail', 'measured-steps', 'treasure-journey']) {
        const fixture = fixtures.find(item => item.id === id); await begin(page, fixture.config);
        for (const [index, leg] of fixture.legs.entries()) {
          await replay(page, leg.actions);
          assert.equal(await page.locator('#adventure').getAttribute('data-status'), 'won', `${id} leg ${index + 1}`);
          assert.equal(await page.locator('#game-turns').textContent(), String(leg.turns));
          const state = JSON.parse(await snapshot(page)).state; assert.equal(state.receipts.length, index + 1);
          if (leg.perk) {
            const campCheckpoint = await snapshot(page);
            await clickControl(page, '#game-primary'); assert.equal(await page.locator('#camp-dialog').isVisible(), true);
            if (index === 0) {
              await clickControl(page, '#camp-cancel'); compareCheckpoint(campCheckpoint, await snapshot(page));
              await clickControl(page, '#game-primary'); await page.keyboard.press('Escape'); compareCheckpoint(campCheckpoint, await snapshot(page));
              await page.reload(); await resume(page); compareCheckpoint(campCheckpoint, await snapshot(page));
              await clickControl(page, '#game-primary');
            }
            await page.locator(`input[name="camp-perk"][value="${leg.perk}"]`).check();
            await page.locator(`input[name="camp-route"][value="${leg.route}"]`).check();
            if (screenshots && id === 'long-voyage' && index === 0) await page.screenshot({ path: '.playwright-mcp/expedition-camp-desktop.png' });
            await clickControl(page, '#camp-continue');
            assert.equal(await page.locator('#game-turns').textContent(), '0');
          } else {
            assert.match(await page.locator('#game-result-title').textContent(), /expedition is complete/);
            const final = await snapshot(page), book = await page.evaluate(key => localStorage.getItem(key), logbookKey);
            await page.reload(); await resume(page); compareCheckpoint(final, await snapshot(page));
            assert.equal(await page.evaluate(key => localStorage.getItem(key), logbookKey), book, 'Resume cannot duplicate badges or score.');
          }
        }
        results.push({ run: id, legs: fixture.legs.length, turns: fixture.legs.reduce((n, leg) => n + leg.turns, 0), checks: 'Every objective through real inputs, branching/camp upgrades, camp cancel/Escape/reload, final resume, retained logbook credit.' });
      }
      const finalRetained = await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), Object.keys(retained));
      assert.deepEqual(finalRetained, retained, 'Expeditions must retain editor, campaign bests, and campaign learned memory.');
      assert.deepEqual(errors, []); assert.deepEqual(failures, []);
      // Portable checkpoint: mid-conversation, then a played turn, and all import failure paths.
      await begin(page, { seed: 'portable-save', length: 3 });
      await clickControl(page, '#game-interact'); const dialogueSave = await snapshot(page);
      await page.reload(); await resume(page); compareCheckpoint(dialogueSave, await snapshot(page));
      assert.equal(await page.locator('#conversation-dialog').isVisible(), true);
      await clickControl(page, '[data-choice="decoy"]'); await clickControl(page, '#conversation-close'); await clickControl(page, '#game-wait');
      const portable = await snapshot(page); await clickControl(page, '#game-pause');
      await page.locator('#adventure-canvas').focus(); await page.keyboard.press('ArrowRight'); compareCheckpoint(portable, await snapshot(page));
      await clickControl(page, '#game-primary');
      await hub(page); const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#expedition-export').click()]);
      const chunks = []; for await (const chunk of await download.createReadStream()) chunks.push(chunk);
      const backup = Buffer.concat(chunks).toString('utf8'); compareCheckpoint(portable, backup);
      const invalid = ['{', 'x'.repeat(220001), JSON.stringify({ version: 99 }), (() => { const data = JSON.parse(backup); data.fingerprint = 'wrong'; return JSON.stringify(data); })()];
      for (const buffer of invalid) {
        await page.locator('#expedition-file').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from(buffer) });
        await page.waitForFunction(() => !document.querySelector('#expedition-import').disabled);
        await page.locator('#expedition-form-error').waitFor(); compareCheckpoint(portable, await snapshot(page));
      }
      page.once('dialog', dialog => dialog.dismiss());
      await page.locator('#expedition-file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(backup) });
      await page.waitForFunction(() => !document.querySelector('#expedition-import').disabled); compareCheckpoint(portable, await snapshot(page));
      await clickControl(page, '#mode-create'); await clickControl(page, '#mode-play'); await hub(page);
      await clickControl(page, '#library-story'); await clickControl(page, '#begin-contracts'); await resume(page); compareCheckpoint(portable, await snapshot(page));
      await clickControl(page, '#game-restart'); const retried = JSON.parse(await snapshot(page));
      assert.equal(retried.state.retries, 1); assert.equal(await page.locator('#game-turns').textContent(), '0');
      await page.reload(); await resume(page); compareCheckpoint(JSON.stringify(retried), await snapshot(page));
      await clickControl(page, '#game-sound'); assert.equal(await page.locator('#game-sound').getAttribute('aria-pressed'), 'true');
      await clickControl(page, '#game-shield'); await clickControl(page, '#game-sound'); assert.equal(await page.locator('#game-sound').getAttribute('aria-pressed'), 'false');
      const portableContext = await browser.newContext();
      try {
        const other = await portableContext.newPage(); await other.goto(`${baseURL}/#play`); await hub(other);
        await other.locator('#expedition-file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(backup) });
        await other.locator('#game-expedition-banner').waitFor(); compareCheckpoint(backup, await snapshot(other));
      } finally { await portableContext.close(); }
      assert.deepEqual(errors, []); assert.deepEqual(failures, []);
      results.push({ checks: 'Mid-dialogue reload, pause suppression, JSON download/import in a new context, malformed/oversized/future/tampered import rejection, cancel valid import, story/editor switching, retry/reload, opt-in sound toggle.' });
      const lossFixture = fixtures.find(item => item.id === 'nemesis-journey');
      await begin(page, lossFixture.config); await replay(page, lossFixture.legs[0].actions); await clickControl(page, '#game-primary');
      await page.locator(`input[name="camp-perk"][value="${lossFixture.legs[0].perk}"]`).check();
      await page.locator(`input[name="camp-route"][value="${lossFixture.legs[0].route}"]`).check(); await clickControl(page, '#camp-continue');
      await replay(page, [...lossFixture.legs[1].actions.slice(0, 13), ...Array(19).fill('wait')]);
      assert.equal(await page.locator('#adventure').getAttribute('data-status'), 'lost');
      const lost = await snapshot(page); await page.reload(); await resume(page); compareCheckpoint(lost, await snapshot(page));
      await clickControl(page, '#game-primary'); const recovered = JSON.parse(await snapshot(page)).state;
      assert.equal(recovered.retries, 1); assert.equal(recovered.leg, 1); assert.equal(recovered.receipts.length, 1); assert.equal(recovered.perks.length, 1);
      assert.equal(await page.locator('#game-turns').textContent(), '0'); assert.deepEqual(errors, []);
      results.push({ checks: 'Actual later-leg loss, exact lost-state reload, retry retains the completed leg, camp upgrade, starting supplies, and learned habits.' });
    } finally { await context.close(); }
    // Narrow phones: real controls and a complete courier delivery, including setting down/reclaiming the relic.
    for (const width of [320, 390, 768]) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
      try {
        const page = await context.newPage(), errors = []; page.on('pageerror', error => errors.push(error.message));
        await page.goto(`${baseURL}/#play`); const fixture = fixtures.find(item => item.id === 'contract-trail-unwarded'); await begin(page, fixture.config);
        await clickControl(page, '#game-interact', true); await clickControl(page, '[data-choice="decoy"]', true); await clickControl(page, '#conversation-close', true);
        await page.locator('.game-main').evaluate(el => el.scrollIntoView({ block: 'start' }));
        const controls = await page.locator('.tactical-actions').boundingBox(); assert.ok(controls.y + controls.height <= 844, 'Courier controls visible on a narrow phone.');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
        await clickControl(page, '#game-restart', true);
        // Retry retains learning, so restore the fresh checkpoint using a new ordinary start.
        await begin(page, fixture.config);
        await page.locator('#adventure-canvas').focus(); let dropped = false;
        for (const action of fixture.legs[0].actions) {
          await input(page, action);
          if (!dropped && action === 'interact:relic') {
            const held = await snapshot(page); await clickControl(page, '#game-cargo', true);
            assert.equal(await page.locator('#game-cargo').isDisabled(), true); await clickControl(page, '#game-interact', true);
            assert.equal(await page.locator('#game-cargo').isDisabled(), false);
            // Return to the held checkpoint to keep the golden route's enemy timing; import is verified in the UI.
            await hub(page); page.once('dialog', dialog => dialog.accept());
            await page.locator('#expedition-file').setInputFiles({ name: 'held.json', mimeType: 'application/json', buffer: Buffer.from(held) });
            await page.waitForFunction(() => !document.querySelector('#expedition-import').disabled);
            await page.locator('#adventure-canvas').focus(); dropped = true;
          }
        }
        assert.ok(dropped); assert.equal(await page.locator('#adventure').getAttribute('data-status'), 'won');
        assert.match(await page.locator('#quest-mission [data-complete="true"]').allTextContents().then(lines => lines.join(' ')), /relic/i);
        if (screenshots && width === 390) await page.screenshot({ path: '.playwright-mcp/expedition-courier-mobile.png' });
        const journey = fixtures.find(item => item.id === 'long-voyage'); await begin(page, journey.config); await replay(page, journey.legs[0].actions);
        await clickControl(page, '#game-primary', true); const box = await page.locator('#camp-dialog').boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= width && box.y >= 0 && box.y + box.height <= 844);
        const footer = await page.locator('#camp-continue').boundingBox(); assert.ok(footer.y >= 0 && footer.y + footer.height <= 844, 'Camp departure stays visible while the choices scroll.');
        await page.locator('input[name="camp-perk"][value="restock"]').check(); await page.locator('input[name="camp-route"][value="b"]').check();
        if (screenshots && width === 390) await page.screenshot({ path: '.playwright-mcp/expedition-camp-mobile.png' });
        await clickControl(page, '#camp-continue', true); assert.equal(JSON.parse(await snapshot(page)).state.leg, 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width); assert.deepEqual(errors, []);
        results.push({ width, checks: 'Touch dialogue and cargo drop/reclaim, complete courier run, bounded scrollable camp, restock/perilous choice, reduced motion, visible controls and no sideways overflow.' });
      } finally { await context.close(); }
    }
    for (const failure of ['blocked', 'quota']) {
      const context = await browser.newContext({ acceptDownloads: true });
      try {
        await context.addInitScript(kind => {
          if (kind === 'blocked') Object.defineProperty(window, 'localStorage', { get() { throw Error('Storage unavailable'); } });
          else Storage.prototype.setItem = function () { throw new DOMException('Quota exceeded', 'QuotaExceededError'); };
        }, failure);
        const page = await context.newPage(), fixture = fixtures.find(item => item.id === 'contract-trail-none');
        await page.goto(`${baseURL}/#play`); await hub(page); await selectControl(page, '#expedition-mode', 'contract');
        await page.locator('#expedition-seed').fill(fixture.config.seed); await clickControl(page, '#expedition-start');
        assert.match(await page.locator('#game-save-note').textContent(), /Checkpoint unavailable/);
        await replay(page, fixture.legs[0].actions); assert.equal(await page.locator('#adventure').getAttribute('data-status'), 'won');
        await hub(page); const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#expedition-export').click()]);
        assert.match(download.suggestedFilename(), /^tilewright-expedition-/);
        results.push({ failure, checks: 'Unavailable storage still permits a complete run, truthful checkpoint warning, in-session logbook, and a portable backup export.' });
      } finally { await context.close(); }
    }
    return { browser: browser.version(), results };
  } finally { await browser.close(); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { chromium } = await import('playwright');
  console.log(JSON.stringify(await checkExpeditions(chromium), null, 2));
}
