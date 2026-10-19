import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
const BASE = 'http://127.0.0.1:4174', recordKey = 'tilewright.guild.v1';
const keys = { up: 'ArrowUp', right: 'ArrowRight', down: 'ArrowDown', left: 'ArrowLeft', wait: 'Space', decoy: 'q', shield: 'c', power: 'b' };
async function input(page, value, touch = false) {
  if (value.startsWith('interact:')) {
    if (await page.locator('#game-target-wrap').isVisible()) await page.locator('#game-target').selectOption(value.slice(9));
    if (touch) await page.locator('#game-interact').tap();
    else { await page.locator('#adventure-canvas').focus(); await page.keyboard.press('e'); }
  } else if (value.startsWith('choose:')) await page.locator(`[data-choice="${value.slice(7)}"]`)[touch ? 'tap' : 'click']();
  else if (value === 'close-dialogue') await page.locator('#conversation-close')[touch ? 'tap' : 'click']();
  else if (touch && value.startsWith('dash-')) { await page.locator('#dash-button').tap(); await page.locator(`[data-move="${value.slice(5)}"]`).tap(); }
  else if (touch) await page.locator(['up', 'right', 'down', 'left'].includes(value) ? `[data-move="${value}"]` : { wait: '#game-wait', decoy: '#game-decoy', shield: '#game-shield', power: '#game-power' }[value]).tap();
  else await page.keyboard.press(value.startsWith('dash-') ? `Shift+${keys[value.slice(5)]}` : keys[value]);
}
async function play(page, actions, touch = false) { await page.locator('#adventure-canvas').focus(); for (const action of actions) await input(page, action, touch); }
async function start(page, fixture, touch = false) {
  await page.locator('#library-guild')[touch ? 'tap' : 'click'](); await page.locator('#game-difficulty').selectOption(fixture.difficulty);
  await page.locator('#guild-kit').selectOption(fixture.kit); await page.locator('#forget-habits').click();
  await page.locator(`[data-guild-job="${fixture.id}"]`)[touch ? 'tap' : 'click']();
  assert.equal(await page.locator('#game-turns').textContent(), '0'); assert.equal(await page.locator('#game-power').isDisabled(), false);
}
async function won(page, fixture) {
  assert.equal(await page.locator('#adventure').getAttribute('data-status'), 'won', `${fixture.id}/${fixture.kit}/${fixture.difficulty}`);
  assert.equal(await page.locator('#game-stars').textContent(), '★★★'); assert.equal(await page.locator('#game-turns').textContent(), String(fixture.result.turns));
  const count = fixture.merits.filter(merit => merit.done).length;
  assert.ok((await page.locator('#game-result-text').textContent()).includes(`${count}/3 commendations`));
  if (count === 3) assert.equal((await page.locator('#game-guild-merits').textContent()).includes('○'), false);
}
export async function checkGuild(browserType, { baseURL = BASE, channel = 'chrome', fixtures, alternates, screenshots = false, widths = [320, 390, 768, 1024] } = {}) {
  fixtures ??= JSON.parse(await readFile(new URL('../tests/fixtures/guild-routes.json', import.meta.url), 'utf8'));
  alternates ??= JSON.parse(await readFile(new URL('../tests/fixtures/guild-alternate-routes.json', import.meta.url), 'utf8'));
  const browser = await browserType.launch({ headless: true, channel }), results = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    try {
      const page = await context.newPage(), errors = []; page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
      await page.goto(`${baseURL}/#play`); await page.locator('#adventure[data-status="playing"]').waitFor();
      const original = await page.evaluate(() => [localStorage.getItem('tilewright.document.v1'), localStorage.getItem('tilewright.adventures.v1')]);
      await page.locator('#library-guild').click(); assert.equal(await page.locator('[data-guild-job]').count(), 6);
      assert.equal(await page.locator('[data-guild-job]:disabled').count(), 0); assert.equal(await page.locator('#guild-kit option').count(), 2);
      for (const fixture of fixtures) {
        await start(page, fixture); await page.locator('#adventure-canvas').focus(); let jumps = 0;
        for (const action of fixture.actions) {
          if (action === 'power') { const energy = await page.locator('.energy-pip.filled').count(); await input(page, action); assert.equal(await page.locator('.energy-pip.filled').count(), energy - 2); assert.equal(await page.locator('#game-power').isDisabled(), true); }
          else await input(page, action);
          if (action.startsWith('interact:') && /-(west|east)$/.test(action)) {
            jumps++; const turn = await page.locator('#game-turns').textContent(); await page.locator('#game-inspect').click();
            assert.match(await page.locator('#forecast-lines').textContent(), /energy|Recharges/); await page.keyboard.press('b'); assert.equal(await page.locator('#game-turns').textContent(), turn); await page.keyboard.press('Escape'); await page.locator('#adventure-canvas').focus();
            if (screenshots && fixture.id === 'guild-6' && fixture.kit === 'mistweaver' && fixture.difficulty === 'nemesis' && jumps === 1) {
              await page.locator('.game-main').evaluate(el => el.scrollIntoView({ block: 'start' })); await page.screenshot({ path: '.playwright-mcp/guild-tools-desktop.png' });
            }
          }
        }
        await won(page, fixture);
        const record = await page.evaluate(({ key, id }) => JSON.parse(localStorage.getItem(key)).records[id], { key: recordKey, id: `${fixture.id}-${fixture.kit}-${fixture.difficulty}` });
        assert.equal(record.merits, 3); assert.equal(record.turns, fixture.result.turns);
        results.push({ job: fixture.id, kit: fixture.kit, rules: fixture.difficulty, turns: fixture.result.turns, jumps });
      }
      for (const fixture of alternates) {
        await start(page, fixture);
        const before = await page.evaluate(({ key, id }) => JSON.parse(localStorage.getItem(key)).records[id], { key: recordKey, id: `${fixture.id}-${fixture.kit}-${fixture.difficulty}` });
        await play(page, fixture.actions); await won(page, fixture);
        assert.match(await page.locator('#game-guild-state').textContent(), fixture.id === 'guild-2' ? /0 waystone jumps/ : /1 waystone jumps/);
        const after = await page.evaluate(({ key, id }) => JSON.parse(localStorage.getItem(key)).records[id], { key: recordKey, id: `${fixture.id}-${fixture.kit}-${fixture.difficulty}` });
        assert.deepEqual(after, before); results.push({ alternate: fixture.id, kit: fixture.kit, rules: fixture.difficulty, checks: 'Short route wins without Traveler and retains the higher-commendation best.' });
      }
      await page.locator('#game-primary').click(); assert.equal(await page.locator('#guild-hub').isVisible(), true); assert.match(await page.locator('#guild-progress').textContent(), /6\/6 jobs.*18\/18 commendations/);
      if (screenshots) { await page.locator('#guild-hub').evaluate(el => el.scrollIntoView({ block: 'start' })); await page.screenshot({ path: '.playwright-mcp/guild-board.png' }); }
      assert.deepEqual(await page.evaluate(() => [localStorage.getItem('tilewright.document.v1'), localStorage.getItem('tilewright.adventures.v1')]), original);
      await page.reload(); await page.locator('#library-guild').click(); await page.locator('#guild-kit').selectOption('mistweaver'); await page.locator('#game-difficulty').selectOption('nemesis');
      assert.match(await page.locator('#guild-progress').textContent(), /18\/18 commendations/);
      const fixture = fixtures.find(f => f.id === 'guild-1' && f.kit === 'mistweaver' && f.difficulty === 'trail'); await start(page, fixture);
      await page.locator('#game-interact').click(); await page.keyboard.press('b'); assert.equal(await page.locator('#game-turns').textContent(), '0'); await page.keyboard.press('Escape');
      await page.locator('#game-pause').click(); assert.equal(await page.locator('#game-power').isDisabled(), true); await page.keyboard.press('b'); assert.equal(await page.locator('#game-turns').textContent(), '0'); await page.locator('#game-pause').click();
      await page.locator('#adventure-canvas').focus(); await page.keyboard.press('b'); assert.equal(await page.locator('#game-turns').textContent(), '1'); assert.equal(await page.locator('#game-power').isDisabled(), true);
      await page.locator('#mode-create').click(); await page.locator('#mode-play').click(); assert.equal(await page.locator('#game-turns').textContent(), '1');
      await page.locator('#game-restart').click(); assert.equal(await page.locator('#game-turns').textContent(), '0'); assert.equal(await page.locator('#game-power').isDisabled(), false);
      await page.locator('#library-story').click(); assert.equal(await page.locator('#guild-hub').isVisible(), false); assert.equal(await page.locator('#trail-picker').isVisible(), true);
      assert.deepEqual(errors, []); results.push({ checks: 'Both kits/rules save separately, all 24 results reload, original saves retained, B/modal/pause isolation, restart and editor return.' });
    } finally { await context.close(); }
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, hasTouch: true, isMobile: width < 761, reducedMotion: 'reduce' });
      try {
        const page = await context.newPage(), errors = []; page.on('pageerror', error => errors.push(error.message)); await page.goto(`${baseURL}/#play`);
        for (let index = 1; index <= 6; index++) {
          const kit = (index + width) % 2 ? 'mistweaver' : 'bellrunner', fixture = fixtures.find(f => f.id === `guild-${index}` && f.kit === kit && f.difficulty === 'trail');
          await start(page, fixture, true); await page.locator('.game-main').evaluate(el => el.scrollIntoView({ block: 'start' }));
          const controls = await page.locator('.tactical-actions').boundingBox(); assert.ok(controls.y + controls.height <= 844, `${width}/${fixture.id} entry controls`);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
          await play(page, fixture.actions, true); await won(page, fixture);
          if (screenshots && width === 390 && index === 6) {
            await start(page, fixture, true); await play(page, fixture.actions.slice(0, 14), true); await page.locator('.game-main').evaluate(el => el.scrollIntoView({ block: 'start' })); await page.screenshot({ path: '.playwright-mcp/guild-mobile.png' });
          }
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width); assert.deepEqual(errors, []);
        results.push({ width, checks: 'Six complete clean jobs with touch movement, waystones and specialist powers; entry controls visible, reduced motion, no sideways overflow.' });
      } finally { await context.close(); }
    }
    for (const failure of ['blocked', 'quota']) {
      const context = await browser.newContext();
      try {
        await context.addInitScript(failure => { const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
          Storage.prototype.getItem = function(key) { if (failure === 'blocked') throw Error('blocked storage'); return get.call(this, key); };
          Storage.prototype.setItem = function(key, value) { if (failure === 'blocked' || key === 'tilewright.guild.v1') throw Error('quota'); return set.call(this, key, value); };
        }, failure);
        const page = await context.newPage(); await page.goto(`${baseURL}/#play`); const fixture = fixtures[0]; await start(page, fixture); await play(page, fixture.actions); await won(page, fixture);
        assert.match(await page.locator('#game-save-note').textContent(), /saving unavailable/i); await page.locator('#game-primary').click(); assert.match(await page.locator('#guild-progress').textContent(), /1\/6 jobs.*Saving unavailable/);
        results.push({ failure, checks: 'Complete job and commendations remain playable in session with truthful saving warning.' });
      } finally { await context.close(); }
    }
    return { browser: browser.version(), results };
  } finally { await browser.close(); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { chromium } = await import('playwright'); console.log(JSON.stringify(await checkGuild(chromium), null, 2));
}
