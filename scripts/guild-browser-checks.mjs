import { clickControl, selectControl, enterFirstTrail } from './ui-driver.mjs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
const BASE = 'http://127.0.0.1:4174', recordKey = 'tilewright.guild.v1';
const keys = { up: 'ArrowUp', right: 'ArrowRight', down: 'ArrowDown', left: 'ArrowLeft', wait: 'Space', decoy: 'q', shield: 'c', power: 'b' };
async function input(page, value, touch = false) {
  if (value.startsWith('interact:')) {
    if (await page.locator('#game-target-wrap').isVisible()) await selectControl(page, '#game-target', value.slice(9));
    if (touch) await clickControl(page, '#game-interact', true);
    else { await page.locator('#adventure-canvas').focus(); await page.keyboard.press('e'); }
  } else if (value.startsWith('choose:')) await clickControl(page, `[data-choice="${value.slice(7)}"]`, touch);
  else if (value === 'close-dialogue') await clickControl(page, '#conversation-close', touch);
  else if (touch && value.startsWith('dash-')) { await clickControl(page, '#dash-button', true); await clickControl(page, `[data-move="${value.slice(5)}"]`, true); }
  else if (touch) await page.locator(['up', 'right', 'down', 'left'].includes(value) ? `[data-move="${value}"]` : { wait: '#game-wait', decoy: '#game-decoy', shield: '#game-shield', power: '#game-power' }[value]).tap();
  else await page.keyboard.press(value.startsWith('dash-') ? `Shift+${keys[value.slice(5)]}` : keys[value]);
}
async function play(page, actions, touch = false) { await page.locator('#adventure-canvas').focus(); for (const action of actions) await input(page, action, touch); }
async function start(page, fixture, touch = false) {
  await clickControl(page, '#library-guild', touch); await selectControl(page, '#game-difficulty', fixture.difficulty);
  await selectControl(page, '#guild-kit', fixture.kit); await clickControl(page, '#forget-habits');
  await clickControl(page, `[data-guild-job="${fixture.id}"]`, touch);
  assert.equal(await page.locator('#game-turns').textContent(), '0'); assert.equal(await page.locator('#game-power').isDisabled(), false);
}
async function won(page, fixture) {
  assert.equal(await page.locator('#adventure').getAttribute('data-status'), 'won', `${fixture.id}/${fixture.kit}/${fixture.difficulty}`);
  assert.equal(await page.locator('#game-stars').textContent(), '★★★'); assert.equal(await page.locator('#game-turns').textContent(), String(fixture.result.turns));
  const count = fixture.merits.filter(merit => merit.done).length;
  assert.ok((await page.locator('#game-result-text').textContent()).includes(`${count}/3 commendations`));
  assert.equal(await page.locator('#game-guild-merits [data-earned="true"]').count(), count);
  assert.equal(await page.locator('#quest-mission [data-complete="false"]').count(), 0);
  assert.doesNotMatch(await page.locator('#game-guild-merits, #notes-quest, #game-status').allTextContents().then(parts => parts.join(' ')), /[✓○✦]/);
}
export { start as startGuild, play as playGuild, won as assertGuildWin };
export async function checkGuild(browserType, { baseURL = BASE, channel = 'chrome', fixtures, alternates, screenshots = false, widths = [320, 390, 768, 1024], onProgress = () => {}, desktop = true } = {}) {
  fixtures ??= JSON.parse(await readFile(new URL('../tests/fixtures/guild-routes.json', import.meta.url), 'utf8'));
  alternates ??= JSON.parse(await readFile(new URL('../tests/fixtures/guild-alternate-routes.json', import.meta.url), 'utf8'));
  const browser = await browserType.launch({ headless: true, channel }), results = [];
  try {
    if (desktop) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
      try {
        const page = await context.newPage(), errors = []; page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
        await page.goto(`${baseURL}/#play`); await enterFirstTrail(page); await page.locator('#adventure[data-status="playing"]').waitFor();
        const original = await page.evaluate(() => [localStorage.getItem('tilewright.document.v1'), localStorage.getItem('tilewright.adventures.v1')]);
        await clickControl(page, '#library-guild'); assert.equal(await page.locator('[data-guild-job]').count(), 8);
        assert.equal(await page.locator('[data-guild-job]:disabled').count(), 0); assert.equal(await page.locator('#guild-kit option').count(), 3);
        for (const fixture of fixtures) {
          await start(page, fixture); await page.locator('#adventure-canvas').focus(); let jumps = 0, captureDouble = false;
          for (const action of fixture.actions) {
            if (action === 'power') {
              const energy = await page.locator('.energy-pip.filled').count(), returning = (await page.locator('#game-power').textContent()).startsWith('Return');
              await input(page, action); assert.equal(await page.locator('.energy-pip.filled').count(), energy - (returning ? 1 : 2));
              if (fixture.kit !== 'echoist') assert.equal(await page.locator('#game-power').isDisabled(), true);
              if (screenshots && fixture.id === 'guild-7' && fixture.kit === 'echoist' && fixture.difficulty === 'trail' && !returning) {
                const turn = await page.locator('#game-turns').textContent(); await clickControl(page, '#game-inspect');
                assert.match(await page.locator('#forecast-lines').textContent(), /Double:.*6 turns left/); await page.keyboard.press('b');
                assert.equal(await page.locator('#game-turns').textContent(), turn); await page.keyboard.press('Escape'); await page.locator('#adventure-canvas').focus();
                captureDouble = true;
              }
            }
            else await input(page, action);
            if (captureDouble && action !== 'power') { await page.screenshot({ path: '.playwright-mcp/echo-bridge-desktop.png' }); captureDouble = false; }
            if (action.startsWith('interact:') && /-(west|east)$/.test(action)) {
              jumps++; const turn = await page.locator('#game-turns').textContent(); await clickControl(page, '#game-inspect');
              assert.match(await page.locator('#forecast-lines').textContent(), /energy|Recharges/); await page.keyboard.press('b'); assert.equal(await page.locator('#game-turns').textContent(), turn); await page.keyboard.press('Escape'); await page.locator('#adventure-canvas').focus();
              if (screenshots && fixture.id === 'guild-6' && fixture.kit === 'mistweaver' && fixture.difficulty === 'nemesis' && jumps === 1) {
                await page.locator('.game-main').evaluate(el => el.scrollIntoView({ block: 'start' })); await page.screenshot({ path: '.playwright-mcp/guild-tools-desktop.png' });
              }
            }
          }
          await won(page, fixture);
          const record = await page.evaluate(({ key, id }) => JSON.parse(localStorage.getItem(key)).records[id], { key: recordKey, id: `${fixture.id}-${fixture.kit}-${fixture.difficulty}` });
          assert.equal(record.merits, 3); assert.equal(record.turns, fixture.result.turns);
          const entry = { job: fixture.id, kit: fixture.kit, rules: fixture.difficulty, turns: fixture.result.turns, jumps }; results.push(entry); onProgress(entry);
        }
        for (const fixture of alternates) {
          await start(page, fixture);
          const before = await page.evaluate(({ key, id }) => JSON.parse(localStorage.getItem(key)).records[id], { key: recordKey, id: `${fixture.id}-${fixture.kit}-${fixture.difficulty}` });
          await play(page, fixture.actions); await won(page, fixture);
          if (['guild-2', 'guild-5'].includes(fixture.id)) assert.match(await page.locator('#game-guild-state').textContent(), fixture.id === 'guild-2' ? /0 waystone jumps/ : /1 waystone jumps/);
          const after = await page.evaluate(({ key, id }) => JSON.parse(localStorage.getItem(key)).records[id], { key: recordKey, id: `${fixture.id}-${fixture.kit}-${fixture.difficulty}` });
          if (['guild-2', 'guild-5'].includes(fixture.id)) assert.deepEqual(after, before);
          else { assert.equal(after.merits, 3); assert.ok(after.score >= before.score); }
          const entry = { alternate: fixture.id, kit: fixture.kit, rules: fixture.difficulty, checks: 'Alternate route or dialogue choice completes and retains the strongest best.' }; results.push(entry); onProgress(entry);
        }
        await clickControl(page, '#game-primary'); assert.equal(await page.locator('#guild-hub').isVisible(), true); assert.match(await page.locator('#guild-progress').textContent(), /8\/8 jobs.*24\/24 commendations/);
        if (screenshots) { await page.locator('#guild-hub').evaluate(el => el.scrollIntoView({ block: 'start' })); await page.screenshot({ path: '.playwright-mcp/guild-board.png' }); }
        assert.deepEqual(await page.evaluate(() => [localStorage.getItem('tilewright.document.v1'), localStorage.getItem('tilewright.adventures.v1')]), original);
        await page.reload(); await clickControl(page, '#library-guild'); await selectControl(page, '#guild-kit', 'mistweaver'); await selectControl(page, '#game-difficulty', 'nemesis');
        assert.match(await page.locator('#guild-progress').textContent(), /24\/24 commendations/);
        const fixture = fixtures.find(f => f.id === 'guild-1' && f.kit === 'mistweaver' && f.difficulty === 'trail'); await start(page, fixture);
        await clickControl(page, '#game-interact'); await page.keyboard.press('b'); assert.equal(await page.locator('#game-turns').textContent(), '0'); await page.keyboard.press('Escape');
        await clickControl(page, '#game-pause'); assert.equal(await page.locator('#game-power').isDisabled(), true); await page.keyboard.press('b'); assert.equal(await page.locator('#game-turns').textContent(), '0'); await clickControl(page, '#game-pause');
        await page.locator('#adventure-canvas').focus(); await page.keyboard.press('b'); assert.equal(await page.locator('#game-turns').textContent(), '1'); assert.equal(await page.locator('#game-power').isDisabled(), true);
        await clickControl(page, '#mode-create'); await clickControl(page, '#mode-play'); assert.equal(await page.locator('#game-turns').textContent(), '1');
        await clickControl(page, '#game-restart'); assert.equal(await page.locator('#game-turns').textContent(), '0'); assert.equal(await page.locator('#game-power').isDisabled(), false);
        await clickControl(page, '#library-story'); assert.equal(await page.locator('#guild-hub').isVisible(), false); assert.equal(await page.locator('#trail-picker').isVisible(), true);
        assert.deepEqual(errors, []); results.push({ checks: 'Three kits/rules save separately, all 48 results reload, original saves retained, B/modal/pause isolation, restart and editor return.' });
      } finally { await context.close(); }
    }
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, hasTouch: true, isMobile: width < 761, reducedMotion: 'reduce' });
      try {
        const page = await context.newPage(), errors = []; page.on('pageerror', error => errors.push(error.message)); await page.goto(`${baseURL}/#play`);
        for (let index = 1; index <= 8; index++) {
          const kit = index >= 7 ? 'echoist' : ['bellrunner', 'mistweaver', 'echoist'][(index + width) % 3], fixture = (index === 8 ? alternates : fixtures).find(f => f.id === `guild-${index}` && f.kit === kit && f.difficulty === 'trail');
          await start(page, fixture, true); await page.locator('.game-main').evaluate(el => el.scrollIntoView({ block: 'start' }));
          const controls = await page.locator('.tactical-actions').boundingBox(); assert.ok(controls.y + controls.height <= 844, `${width}/${fixture.id} entry controls`);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
          await play(page, fixture.actions, true); await won(page, fixture);
          onProgress({ width, job: fixture.id, kit, touch: true });
          if (screenshots && width === 390 && index === 6) {
            await start(page, fixture, true); await play(page, fixture.actions.slice(0, 14), true); await page.locator('.game-main').evaluate(el => el.scrollIntoView({ block: 'start' })); await page.screenshot({ path: '.playwright-mcp/guild-mobile.png' });
          }
          if (screenshots && width === 390 && index === 7) {
            await start(page, fixture, true); await play(page, fixture.actions.slice(0, fixture.actions.indexOf('power') + 2), true);
            assert.match(await page.locator('#game-power').textContent(), /Return/); await page.screenshot({ path: '.playwright-mcp/echo-bridge-mobile.png' });
          }
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width); assert.deepEqual(errors, []);
        results.push({ width, checks: 'Eight complete clean jobs with touch movement, double returns, pressure bridges and waystones; entry controls visible, reduced motion, no sideways overflow.' });
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
        assert.match(await page.locator('#game-save-note').textContent(), /saving unavailable/i); await clickControl(page, '#game-primary'); assert.match(await page.locator('#guild-progress').textContent(), /1\/8 jobs.*Saving unavailable/);
        results.push({ failure, checks: 'Complete job and commendations remain playable in session with truthful saving warning.' });
      } finally { await context.close(); }
    }
    return { browser: browser.version(), results };
  } finally { await browser.close(); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { chromium } = await import('playwright'); console.log(JSON.stringify(await checkGuild(chromium), null, 2));
}
