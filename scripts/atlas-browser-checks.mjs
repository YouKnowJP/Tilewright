import { clickControl, selectControl, enterFirstTrail } from './ui-driver.mjs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
const BASE = 'http://127.0.0.1:4174';
const keys = { up: 'ArrowUp', right: 'ArrowRight', down: 'ArrowDown', left: 'ArrowLeft', wait: 'Space', decoy: 'q', shield: 'c' };
async function play(page, values, touch = false) {
  await page.locator('#adventure-canvas').focus();
  for (const value of values) {
    if (value.startsWith('interact:')) {
      if (await page.locator('#game-target-wrap').isVisible()) await selectControl(page, '#game-target', value.slice(9));
      if (touch) await clickControl(page, '#game-interact', true);
      else { await page.locator('#adventure-canvas').focus(); await page.keyboard.press('e'); }
    } else if (value.startsWith('choose:')) await clickControl(page, `[data-choice="${value.slice(7)}"]`, touch);
    else if (value === 'close-dialogue') await clickControl(page, '#conversation-close', touch);
    else if (touch && value.startsWith('dash-')) { await clickControl(page, '#dash-button', true); await clickControl(page, `[data-move="${value.slice(5)}"]`, true); }
    else if (touch) await page.locator(['up', 'right', 'down', 'left'].includes(value) ? `[data-move="${value}"]` : { wait: '#game-wait', shield: '#game-shield', decoy: '#game-decoy' }[value]).tap();
    else await page.keyboard.press(value.startsWith('dash-') ? `Shift+${keys[value.slice(5)]}` : keys[value]);
  }
}
async function start(page, fixture, touch) {
  await selectControl(page, '#game-difficulty', fixture.difficulty);
  await clickControl(page, '#forget-habits');
  await clickControl(page, `[data-stage="${fixture.id}"]`, touch);
  assert.equal(await page.locator('#game-turns').textContent(), '0');
}
async function won(page, fixture) {
  assert.equal(await page.locator('#adventure').getAttribute('data-status'), 'won', `${fixture.id}/${fixture.difficulty}/${fixture.branch}`);
  assert.equal(await page.locator('#game-stars').textContent(), '★★★');
  assert.equal(await page.locator('#game-turns').textContent(), String(fixture.result.turns));
  assert.match(await page.locator('#game-sidequests').textContent(), /Finish without taking damage — complete/);
}
export async function checkAtlas(browserType, { baseURL = BASE, channel = 'chrome', fixtures, screenshots = false, widths = [320, 390, 768, 1024] } = {}) {
  fixtures ??= JSON.parse(await readFile(new URL('../tests/fixtures/atlas-routes.json', import.meta.url), 'utf8'));
  const browser = await browserType.launch({ headless: true, channel }), results = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    try {
      const page = await context.newPage(), errors = []; page.on('pageerror', error => errors.push(error.message));
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
      await page.goto(`${baseURL}/#play`); await enterFirstTrail(page); await page.locator('#adventure[data-status="playing"]').waitFor();
      const map = await page.evaluate(() => localStorage.getItem('tilewright.document.v1'));
      assert.equal(await page.locator('.atlas-chapter').count(), 8); assert.equal(await page.locator('.trail-art').count(), 24);
      assert.equal(await page.locator('[data-stage="trail-11"]').isDisabled(), true);
      for (const chapter of ['archive', 'dunes', 'aurora']) {
        await clickControl(page, `[data-chapter-start="${chapter}"]`); assert.equal(await page.locator('#game-turns').textContent(), '0');
        await clickControl(page, '#game-interact'); assert.equal(await page.locator('#conversation-portrait').isVisible(), true);
        const bounds = await page.locator('#conversation-dialog').boundingBox(); assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= 1000);
        await page.keyboard.press('Escape');
      }
      for (const fixture of fixtures) {
        await start(page, fixture, false);
        if (['trail-11', 'trail-16'].includes(fixture.id)) { assert.equal(await page.locator('#dash-button').isDisabled(), true); assert.match(await page.locator('#game-rule-note').textContent(), /Walking only/); }
        if (fixture.id === 'trail-14') { assert.equal(await page.locator('#game-shield').isDisabled(), true); assert.match(await page.locator('#game-rule-note').textContent(), /Unwarded/); }
        if (screenshots && fixture.id === 'trail-18' && fixture.difficulty === 'trail' && fixture.branch === 0) {
          const split = fixture.actions.indexOf('interact:relic') + 1;
          await play(page, fixture.actions.slice(0, split)); await page.locator('.game-main').evaluate(el => el.scrollIntoView({ block: 'start' }));
          await page.screenshot({ path: '.playwright-mcp/aurora-finale.png' }); await play(page, fixture.actions.slice(split));
        } else await play(page, fixture.actions);
        await won(page, fixture);
        if (fixture.id === 'trail-18') {
          assert.equal(await page.locator('#quest-plates').isVisible(), false);
          assert.equal(await page.locator('#game-sidequests p').filter({ hasText: 'Build the optional weight bridge' }).getAttribute('data-complete'), String(Boolean(fixture.branch)));
        }
        const record = await page.evaluate(key => JSON.parse(localStorage.getItem('tilewright.adventures.v1')).records[key], fixture.id + (fixture.difficulty === 'nemesis' ? '-nemesis' : ''));
        assert.equal(record.stars, 3);
        if (fixture.difficulty === 'trail' && ['trail-12', 'trail-15', 'trail-18'].includes(fixture.id)) {
          await clickControl(page, '#game-nemesis'); assert.equal(await page.locator('#game-difficulty').inputValue(), 'nemesis');
          assert.equal(await page.locator('#game-title').textContent(), { 'trail-12': 'Whispering Stacks', 'trail-15': 'Cinder Caravan', 'trail-18': 'Frostline Post' }[fixture.id]);
          assert.equal(await page.locator('#game-turns').textContent(), '0');
        }
        results.push({ mission: fixture.id, difficulty: fixture.difficulty, branch: fixture.branch, turns: fixture.result.turns });
      }
      assert.match(await page.locator('#game-primary').textContent(), /Next adventure/);
      await clickControl(page, '#game-primary'); assert.equal(await page.locator('#game-title').textContent(), 'Tideglass Causeway');
      await clickControl(page, '#game-choose'); assert.equal(await page.locator('#trail-picker').isVisible(), true);
      assert.match(await page.locator('.atlas-total').textContent(), /27 \/ 72/);
      await page.reload(); assert.equal(await page.locator('[data-stage="trail-18"]').isDisabled(), false);
      await selectControl(page, '#game-difficulty', 'nemesis'); assert.match(await page.locator('.atlas-total').textContent(), /27 \/ 72/);
      if (screenshots) { await page.locator('#atlas-archive').evaluate(el => el.scrollIntoView({ block: 'start' })); await page.screenshot({ path: '.playwright-mcp/atlas-chapters.png' }); }
      assert.equal(await page.evaluate(() => localStorage.getItem('tilewright.document.v1')), map); assert.deepEqual(errors, []);
    } finally { await context.close(); }
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, hasTouch: true, isMobile: width < 761, reducedMotion: 'reduce' });
      try {
        const page = await context.newPage(), errors = []; page.on('pageerror', error => errors.push(error.message));
        await page.goto(`${baseURL}/#play`);
        for (const id of ['trail-10', 'trail-11', 'trail-12', 'trail-13', 'trail-14', 'trail-15', 'trail-16', 'trail-17', 'trail-18']) {
          const fixture = fixtures.find(item => item.id === id && item.difficulty === 'trail' && item.branch === 0);
          await start(page, fixture, true);
          await page.locator('.game-main').evaluate(el => el.scrollIntoView({ block: 'start' }));
          const controls = await page.locator('.tactical-actions').boundingBox(); assert.ok(controls.y + controls.height <= 844, `${id}/${width} controls remain on screen at entry.`);
          await clickControl(page, '#game-inspect', true); const modal = await page.locator('#forecast-dialog').boundingBox();
          assert.ok(modal.x >= 0 && modal.x + modal.width <= width && modal.y >= 0 && modal.y + modal.height <= 844); await clickControl(page, '#forecast-close', true);
          await play(page, fixture.actions, true); await won(page, fixture);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
        }
        await clickControl(page, '#game-primary', true); await clickControl(page, '#game-choose', true);
        await page.locator('.atlas-nav button').nth(5).tap();
        assert.equal(await page.evaluate(() => document.activeElement.textContent), 'The Long Dawn');
        if (screenshots && width === 390) {
          await page.screenshot({ path: '.playwright-mcp/atlas-mobile.png' });
          await clickControl(page, '[data-chapter-start="aurora"]', true);
          const fixture = fixtures.find(item => item.id === 'trail-16' && item.difficulty === 'trail' && item.branch === 0);
          await play(page, fixture.actions.slice(0, 12), true); await page.locator('.game-main').evaluate(el => el.scrollIntoView({ block: 'start' }));
          await page.screenshot({ path: '.playwright-mcp/aurora-mobile.png' });
        }
        assert.deepEqual(errors, []); results.push({ width, checks: 'All nine new missions completed with touch controls; bounded forecasts, rules, chapter navigation, no horizontal overflow.' });
      } finally { await context.close(); }
    }
    return { browser: browser.version(), results };
  } finally { await browser.close(); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { chromium } = await import('playwright'); console.log(JSON.stringify(await checkAtlas(chromium), null, 2));
}
