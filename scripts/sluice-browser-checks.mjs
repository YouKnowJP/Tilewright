import { clickControl, selectControl, enterFirstTrail } from './ui-driver.mjs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
const BASE = 'http://127.0.0.1:4174';
const arrows = { up: 'ArrowUp', right: 'ArrowRight', down: 'ArrowDown', left: 'ArrowLeft' };
async function action(page, value) {
  if (value.startsWith('interact:')) {
    const id = value.slice(9);
    if (await page.locator('#game-target-wrap').isVisible()) await selectControl(page, '#game-target', id);
    await page.locator('#adventure-canvas').focus(); await page.keyboard.press('e');
  } else if (value.startsWith('choose:')) await clickControl(page, `[data-choice="${value.slice(7)}"]`);
  else if (value === 'close-dialogue') await clickControl(page, '#conversation-close');
  else if (value.startsWith('dash-')) await page.keyboard.press(`Shift+${arrows[value.slice(5)]}`);
  else await page.keyboard.press(arrows[value] || { wait: 'Space', shield: 'c', decoy: 'q', 'drop-cargo': 'x' }[value]);
}
async function play(page, actions) { await page.locator('#adventure-canvas').focus(); for (const value of actions) await action(page, value); }
async function inspect(page) {
  const turn = await page.locator('#game-turns').textContent(); await clickControl(page, '#game-inspect');
  assert.equal(await page.locator('#forecast-dialog').isVisible(), true); await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#game-turns').textContent(), turn); await page.keyboard.press('Escape');
}
async function start(page, fixture) {
  await clickControl(page, '#forget-habits');
  await selectControl(page, '#game-difficulty', fixture.difficulty);
  if (fixture.id === 'trail-7') await clickControl(page, '#begin-sluices');
  else await clickControl(page, `[data-stage="${fixture.id}"]`);
  assert.equal(await page.locator('#game-turns').textContent(), '0');
}
export async function checkSluices(browserType, { baseURL = BASE, channel = 'chrome', fixtures, legacy, expedition, screenshots = false } = {}) {
  fixtures ??= JSON.parse(await readFile(new URL('../tests/fixtures/sluice-routes.json', import.meta.url), 'utf8'));
  legacy ??= JSON.parse(await readFile(new URL('../tests/fixtures/legacy-checkpoints.json', import.meta.url), 'utf8'));
  expedition ??= JSON.parse(await readFile(new URL('../tests/fixtures/expedition-routes.json', import.meta.url), 'utf8'))[0];
  const browser = await browserType.launch({ headless: true, channel }), results = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    try {
      const page = await context.newPage(), errors = [], failures = [];
      page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('response', response => { if (response.status() >= 400) failures.push(response.url()); });
      await page.goto(`${baseURL}/#play`); const map = await page.evaluate(() => localStorage.getItem('tilewright.document.v1'));
      // Regression: URL navigation must dismiss native modals and retain the conversation state.
      for (let attempt = 0; attempt < 5; attempt++) {
        await clickControl(page, '#game-interact'); const turn = await page.locator('#game-turns').textContent();
        await page.evaluate(() => { location.hash = '#mapmaker'; }); await page.waitForFunction(() => !document.querySelector('#editor').hidden);
        assert.equal(await page.locator('#conversation-dialog').isVisible(), false);
        await page.getByRole('button', { name: 'Brush (B)', exact: true }).click();
        await clickControl(page, '#mode-play'); assert.equal(await page.locator('#conversation-dialog').isVisible(), true);
        assert.equal(await page.locator('#game-turns').textContent(), turn); await page.keyboard.press('Escape');
      }
      await inspect(page); await clickControl(page, '#game-inspect'); await page.evaluate(() => { location.hash = '#mapmaker'; });
      await page.waitForFunction(() => !document.querySelector('#editor').hidden); assert.equal(await page.locator('#forecast-dialog').isVisible(), false);
      await clickControl(page, '#mode-play');
      results.push({ checks: 'Five dialogue/editor/back navigation cycles preserve the conversation without trapping the editor; forecast navigation and Escape consume no turn.' });
      // Play all branches and difficulty variants using only public controls.
      for (const fixture of fixtures) {
        await start(page, fixture); await page.locator('#adventure-canvas').focus();
        for (const [index, value] of fixture.actions.entries()) {
          if ((index === 12 || index === 35) && !await page.locator('#conversation-dialog').isVisible()) { await inspect(page); await page.locator('#adventure-canvas').focus(); }
          await action(page, value);
          if (value === 'interact:sen') assert.match(await page.locator('#game-journal').textContent(), /Sen:.*shutters/);
          if (screenshots && fixture.id === 'trail-9' && fixture.difficulty === 'nemesis' && fixture.branch === 1 && value === 'interact:relic') {
            await page.locator('.game-main').evaluate(el => el.scrollIntoView({ block: 'start' })); await page.screenshot({ path: '.playwright-mcp/sluice-finale-desktop.png' });
          }
        }
        assert.equal(await page.locator('#adventure').getAttribute('data-status'), 'won', `${fixture.id}/${fixture.difficulty}/${fixture.branch}`);
        assert.equal(await page.locator('#game-stars').textContent(), '★★★'); assert.equal(await page.locator('#game-turns').textContent(), String(fixture.result.turns));
        assert.equal(await page.locator('#quest-mission [data-complete="false"]').count(), 0);
        const records = await page.evaluate(() => JSON.parse(localStorage.getItem('tilewright.adventures.v1')).records);
        assert.equal(records[fixture.id + (fixture.difficulty === 'nemesis' ? '-nemesis' : '')].stars, 3);
        if (fixture.id === 'trail-9') { assert.match(await page.locator('#game-result-title').textContent(), /Nobody misses/); assert.match(await page.locator('#game-result-text').textContent(), /Sola and Jun rescued/); }
        if (fixture.id === 'trail-9' && fixture.difficulty === 'trail') {
          await clickControl(page, '#game-nemesis'); assert.equal(await page.locator('#game-title').textContent(), 'Rainmoss Sluice'); assert.equal(await page.locator('#game-difficulty').inputValue(), 'nemesis');
        }
        assert.equal(await page.evaluate(() => localStorage.getItem('tilewright.document.v1')), map);
        results.push({ mission: fixture.id, rules: fixture.difficulty, branch: fixture.branch, turns: fixture.result.turns, checks: 'Real-input clean three-star win, valve/relay/cargo/rescue goals, dialogue consequence, independent best, free forecasts, retained editor.' });
      }
      await clickControl(page, '#game-primary');
      assert.equal(await page.locator('#adventure').getAttribute('data-status'), 'playing', 'The sluice finale continues into the archive chapter.');
      await clickControl(page, '#game-choose'); assert.equal(await page.locator('#trail-picker').isVisible(), true);
      await page.reload(); await enterFirstTrail(page); await page.locator('#adventure[data-status="playing"]').waitFor();
      assert.equal(await page.locator('[data-stage="trail-8"]').isDisabled(), false); assert.equal(await page.locator('[data-stage="trail-9"]').isDisabled(), false);
      // A penniless player must not lose a choice or receive goods, and nearby targets must work with keyboard E.
      await clickControl(page, '#begin-sluices');
      await selectControl(page, '#game-difficulty', 'trail'); await clickControl(page, '#forget-habits'); await clickControl(page, '[data-stage="trail-8"]');
      await play(page, ['dash-right', 'right']); // column 7, beside Rook, without collecting either nearby coin.
      await action(page, 'interact:rook');
      assert.equal(await page.locator('[data-choice="decoys"]').isDisabled(), true); assert.equal(await page.locator('[data-choice="shield"]').isDisabled(), true);
      assert.match(await page.locator('#conversation-wallet').textContent(), /Unspent coins: 0/); await page.keyboard.press('Escape');
      const nearbyFixture = fixtures.find(item => item.id === 'trail-9' && item.difficulty === 'trail' && item.branch === 0);
      await start(page, nearbyFixture);
      const relicIndex = nearbyFixture.actions.indexOf('interact:relic');
      await play(page, nearbyFixture.actions.slice(0, relicIndex));
      assert.equal(await page.locator('#game-target-wrap').isVisible(), true);
      await selectControl(page, '#game-target', 'relic'); await page.locator('#game-target-control').focus(); await page.keyboard.press('e');
      assert.equal(await page.locator('#game-cargo').isDisabled(), false);
      // Restore genuine previous-version saves through the file input, then verify immediate migration.
      await clickControl(page, '#begin-expedition');
      for (const fixture of legacy) {
        if (await page.locator('#conversation-dialog').isVisible()) await clickControl(page, '#conversation-close');
        await clickControl(page, '#begin-expedition');
        const previous = await page.evaluate(() => localStorage.getItem('tilewright.expedition.v1'));
        if (previous && JSON.parse(previous).state.phase !== 'won') page.once('dialog', dialog => dialog.accept());
        await page.locator('#expedition-file').setInputFiles({ name: `${fixture.id}.json`, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture.checkpoint)) });
        await page.waitForFunction(() => !document.querySelector('#expedition-import').disabled);
        assert.equal(await page.locator('#game-turns').textContent(), String(fixture.turns));
        const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('tilewright.expedition.v1')));
        assert.equal(saved.rules, '0.6.0'); assert.equal(saved.state.id, fixture.id);
        assert.equal(await page.locator('#adventure').getAttribute('data-status'), ['camp', 'won'].includes(fixture.phase) ? 'won' : fixture.phase);
      }
      results.push({ checks: 'Unaffordable trade buttons are disabled; all six genuine 0.5 checkpoints import and migrate, including dialogue, camp, loss, held cargo, and finish; new mission unlocks survive reload.' });
      // Camp also has to close on browser navigation without discarding the checkpoint.
      await clickControl(page, '#begin-expedition'); await selectControl(page, '#expedition-length', '9'); await page.locator('#expedition-seed').fill(expedition.config.seed);
      await clickControl(page, '#expedition-start'); await play(page, expedition.legs[0].actions); await clickControl(page, '#game-primary');
      await page.evaluate(() => { location.hash = '#mapmaker'; }); await page.waitForFunction(() => !document.querySelector('#editor').hidden);
      assert.equal(await page.locator('#camp-dialog').isVisible(), false); await clickControl(page, '#mode-play'); await clickControl(page, '#game-primary');
      assert.equal(await page.locator('#camp-dialog').isVisible(), true); await clickControl(page, '#camp-cancel');
      assert.deepEqual(errors, []); assert.deepEqual(failures, []);
    } finally { await context.close(); }
    for (const width of [320, 390, 768, 1024]) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
      try {
        const page = await context.newPage(), errors = []; page.on('pageerror', error => errors.push(error.message));
        await page.goto(`${baseURL}/#play`); await clickControl(page, '#begin-sluices', true);
        await page.locator('.game-main').evaluate(el => el.scrollIntoView({ block: 'start' }));
        const controls = await page.locator('.tactical-actions').boundingBox(); assert.ok(controls.y + controls.height <= 844, 'New act controls stay visible at entry.');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
        await clickControl(page, '#game-inspect', true); const modal = await page.locator('#forecast-dialog').boundingBox();
        assert.ok(modal.x >= 0 && modal.x + modal.width <= width && modal.y >= 0 && modal.y + modal.height <= 844);
        await clickControl(page, '#forecast-close', true); await clickControl(page, '#game-interact', true);
        await clickControl(page, '[data-choice="supplies"]', true); await clickControl(page, '#conversation-close', true);
        await clickControl(page, '#game-restart', true); await clickControl(page, '#forget-habits'); await clickControl(page, '#game-restart', true);
        let selections = 0;
        for (const id of ['trail-7', 'trail-8', 'trail-9']) {
          if (id !== 'trail-7') { await clickControl(page, '#forget-habits'); await clickControl(page, '#game-primary', true); }
          const fixture = fixtures.find(item => item.id === id && item.difficulty === 'trail' && item.branch === 1);
          await page.locator('#adventure-canvas').focus();
          for (const value of fixture.actions) {
            try {
              if (value.startsWith('interact:') && await page.locator('#game-target-wrap').isVisible()) {
                await selectControl(page, '#game-target', value.slice(9)); await page.locator('#game-target-control').focus(); await page.keyboard.press('e'); selections++;
              } else await action(page, value);
            } catch (error) {
              const state = await page.evaluate(() => ({ title: document.querySelector('#game-title').textContent, turn: document.querySelector('#game-turns').textContent,
                status: document.querySelector('#game-status').textContent, focus: document.activeElement.id, library: !document.querySelector('#adventure-library').hidden }));
              throw new Error(`${width}px / ${id} / ${value}: ${JSON.stringify(state)}: ${error.message}`, { cause: error });
            }
            if (value === 'interact:intake' && screenshots && width === 390) {
              await page.locator('.game-main').evaluate(el => el.scrollIntoView({ block: 'start' })); await page.screenshot({ path: '.playwright-mcp/sluice-mobile.png' });
            }
          }
          assert.equal(await page.locator('#adventure').getAttribute('data-status'), 'won'); assert.equal(await page.locator('#game-stars').textContent(), '★★★');
        }
        assert.ok(selections >= 2, 'Use the target selector with actual competing interactions.');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width); assert.deepEqual(errors, []);
        results.push({ width, checks: 'Bounded forecast, touch dialogue, reset, all three new missions won with three stars, competing interactions selected with keyboard E, visible entry controls, reduced motion, no horizontal overflow.' });
      } finally { await context.close(); }
    }
    return { browser: browser.version(), results };
  } finally { await browser.close(); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { chromium } = await import('playwright'); console.log(JSON.stringify(await checkSluices(chromium), null, 2));
}
