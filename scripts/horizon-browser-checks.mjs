import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { clickControl, selectControl, enterFirstTrail } from './ui-driver.mjs';
const keys = { up: 'ArrowUp', right: 'ArrowRight', down: 'ArrowDown', left: 'ArrowLeft', wait: 'Space', shield: 'c', decoy: 'q', 'drop-cargo': 'x' };
async function play(page, actions, touch = false) {
  await page.locator('#adventure-canvas').focus();
  for (const action of actions) {
    if (action.startsWith('interact:')) {
      if (await page.locator('#game-target-wrap').isVisible()) await selectControl(page, '#game-target', action.slice(9));
      if (touch) await page.locator('#game-interact').tap();
      else { await page.locator('#adventure-canvas').focus(); await page.keyboard.press('e'); }
    } else if (action.startsWith('choose:')) await clickControl(page, `[data-choice="${action.slice(7)}"]`, touch);
    else if (action === 'close-dialogue') await clickControl(page, '#conversation-close', touch);
    else if (touch && action.startsWith('dash-')) { await page.locator('#dash-button').tap(); await page.locator(`[data-move="${action.slice(5)}"]`).tap(); }
    else if (touch) await page.locator(['up', 'right', 'down', 'left'].includes(action) ? `[data-move="${action}"]` : { wait: '#game-wait', shield: '#game-shield', decoy: '#game-decoy', 'drop-cargo': '#game-cargo' }[action]).tap();
    else await page.keyboard.press(action.startsWith('dash-') ? `Shift+${keys[action.slice(5)]}` : keys[action]);
  }
}
async function start(page, fixture, touch = false) {
  await selectControl(page, '#game-difficulty', fixture.difficulty); await clickControl(page, '#forget-habits');
  await clickControl(page, `[data-stage="${fixture.id}"]`, touch);
  assert.equal(await page.locator('#game-turns').textContent(), '0');
  assert.equal(await page.locator('#adventure-library').isVisible(), false);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), page.viewportSize().width);
  const controls = await page.locator('.tactical-actions').boundingBox();
  assert.ok(controls.y + controls.height <= page.viewportSize().height, `${fixture.id}: controls stay on screen.`);
}
async function won(page, fixture) {
  assert.equal(await page.locator('#adventure').getAttribute('data-status'), 'won', `${fixture.id}/${fixture.difficulty}/${fixture.branch}`);
  assert.equal(await page.locator('#game-stars').textContent(), '★★★');
  assert.equal(await page.locator('#game-turns').textContent(), String(fixture.result.turns));
  assert.match(await page.locator('#game-sidequests').textContent(), /Finish without taking damage — complete/);
  if (fixture.id === 'trail-24') assert.equal(await page.locator('#game-sidequests p').filter({ hasText: 'Build the optional weight bridge' }).getAttribute('data-complete'), String(Boolean(fixture.branch)));
}
export async function checkHorizon(browserType, { baseURL = 'http://127.0.0.1:4174', channel = 'chrome', fixtures, widths = [320, 390, 768, 1024], screenshots = false, onProgress = () => {} } = {}) {
  fixtures ??= JSON.parse(await readFile(new URL('../tests/fixtures/horizon-routes.json', import.meta.url), 'utf8'));
  const intro = JSON.parse(await readFile(new URL('../tests/fixtures/adventure-routes.json', import.meta.url), 'utf8'));
  const browser = await browserType.launch({ headless: true, channel }), results = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    try {
      const page = await context.newPage(), errors = []; page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
      await page.goto(`${baseURL}/#play`); await enterFirstTrail(page); await page.locator('#adventure[data-status="playing"]').waitFor();
      await clickControl(page, '#mode-create'); await page.locator('#map-name').fill('Horizon test map'); await page.locator('#map-name').blur();
      const map = await page.evaluate(() => localStorage.getItem('tilewright.document.v1')); await clickControl(page, '#mode-play');
      await play(page, intro['trail-1']);
      const oldBest = await page.evaluate(() => JSON.parse(localStorage.getItem('tilewright.adventures.v1')).records['trail-1']);
      assert.equal(oldBest.stars, 3);
      await clickControl(page, '#game-choose');
      assert.equal(await page.locator('.atlas-chapter').count(), 8); assert.equal(await page.locator('[data-stage]').count(), 24);
      for (const id of ['trail-19', 'trail-22']) assert.equal(await page.locator(`[data-stage="${id}"]`).isDisabled(), false);
      for (const id of ['trail-20', 'trail-21', 'trail-23', 'trail-24']) assert.equal(await page.locator(`[data-stage="${id}"]`).isDisabled(), true);
      if (screenshots) { await page.locator('.atlas-nav button').nth(6).click(); await page.screenshot({ path: '.playwright-mcp/horizon-chapters.png' }); }
      for (const fixture of fixtures) {
        await start(page, fixture);
        if (screenshots && ['trail-21', 'trail-24'].includes(fixture.id) && fixture.difficulty === 'nemesis' && fixture.branch === 1) {
          const split = fixture.actions.indexOf('interact:relic') + 1;
          await play(page, fixture.actions.slice(0, split)); await page.screenshot({ path: `.playwright-mcp/${fixture.id === 'trail-21' ? 'lighthouse' : 'clockwork'}-desktop.png` });
          await play(page, fixture.actions.slice(split));
        } else await play(page, fixture.actions);
        await won(page, fixture);
        const id = fixture.id + (fixture.difficulty === 'nemesis' ? '-nemesis' : '');
        const best = await page.evaluate(id => JSON.parse(localStorage.getItem('tilewright.adventures.v1')).records[id], id);
        assert.equal(best.stars, 3); assert.ok(best.turns <= fixture.result.turns);
        if (fixture.difficulty === 'trail' && ['trail-21', 'trail-24'].includes(fixture.id)) {
          await clickControl(page, '#game-nemesis'); assert.equal(await page.locator('#game-difficulty').inputValue(), 'nemesis');
          assert.equal(await page.locator('#game-title').textContent(), fixture.id === 'trail-21' ? 'Tideglass Causeway' : 'Clockvine Gardens');
        }
        results.push({ id: fixture.id, rules: fixture.difficulty, choice: fixture.branch, turns: fixture.result.turns });
        await onProgress({ phase: 'desktop', ...results.at(-1) });
      }
      await clickControl(page, '#game-primary'); assert.equal(await page.locator('#adventure-library').isVisible(), true);
      assert.equal(await page.evaluate(() => document.activeElement.textContent), '08 The Clockwork Orchard');
      await page.reload(); await enterFirstTrail(page); await page.locator('#adventure[data-status="playing"]').waitFor();
      for (const id of ['trail-21', 'trail-24']) assert.equal(await page.locator(`[data-stage="${id}"]`).isDisabled(), false);
      const data = await page.evaluate(() => JSON.parse(localStorage.getItem('tilewright.adventures.v1')).records);
      for (let n = 19; n <= 24; n++) for (const suffix of ['', '-nemesis']) assert.equal(data[`trail-${n}${suffix}`].stars, 3);
      assert.deepEqual(data['trail-1'], oldBest); assert.equal(await page.evaluate(() => localStorage.getItem('tilewright.document.v1')), map);
      assert.deepEqual(errors, []); results.push({ checks: 'Open chapter entries, sequential unlocks, separate rule bests/reload, finale replay invitations, visible return focus, and unchanged real editor/intro saves.' });
    } finally { await context.close(); }
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce', hasTouch: true, isMobile: width < 761 });
      try {
        const page = await context.newPage(), errors = []; page.on('pageerror', error => errors.push(error.message));
        await page.goto(`${baseURL}/#play`); await enterFirstTrail(page); await page.locator('#adventure[data-status="playing"]').waitFor();
        for (let n = 19; n <= 24; n++) {
          const fixture = fixtures.find(fixture => fixture.id === `trail-${n}` && fixture.difficulty === 'trail' && fixture.branch === 0);
          await start(page, fixture, true);
          if (n === 23) assert.equal(await page.locator('#dash-button').isDisabled(), true);
          await page.locator('#game-inspect').tap(); const forecast = await page.locator('#forecast-dialog').boundingBox();
          assert.ok(forecast.x >= 0 && forecast.x + forecast.width <= width && forecast.y >= 0 && forecast.y + forecast.height <= 844);
          await page.locator('#forecast-close').tap();
          if (screenshots && width === 390 && n === 24) {
            const split = fixture.actions.indexOf('interact:relic') + 1;
            await play(page, fixture.actions.slice(0, split), true); await page.screenshot({ path: '.playwright-mcp/clockwork-mobile.png' }); await play(page, fixture.actions.slice(split), true);
          } else await play(page, fixture.actions, true);
          await won(page, fixture); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
          await onProgress({ phase: 'touch', width, id: fixture.id });
        }
        assert.deepEqual(errors, []); results.push({ width, checks: 'All six missions complete through touch controls; entry controls, clean results, relics/rescues, crate routes, forecast bounds, and no sideways overflow.' });
      } finally { await context.close(); }
    }
    return { browser: browser.version(), results };
  } finally { await browser.close(); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { chromium } = await import('playwright'); console.log(JSON.stringify(await checkHorizon(chromium), null, 2));
}
