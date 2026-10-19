import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { clickControl, enterFirstTrail } from './ui-driver.mjs';
import { startGuild, playGuild, assertGuildWin } from './guild-browser-checks.mjs';

const keys = { up: 'ArrowUp', right: 'ArrowRight', down: 'ArrowDown', left: 'ArrowLeft', wait: 'Space' };
const saves = page => page.evaluate(() => ['tilewright.document.v1', 'tilewright.adventures.v1', 'tilewright.guild.v1', 'tilewright.expedition.v1', 'tilewright.logbook.v1', 'tilewright.tactics.v1'].map(key => localStorage.getItem(key)));
export async function checkJournal(browserType, { baseURL = 'http://127.0.0.1:4174', channel = 'chrome', screenshots = false } = {}) {
  const browser = await browserType.launch({ headless: true, channel }), results = [];
  try {
    for (const [width, height] of [[320, 740], [390, 844], [768, 900], [1440, 900], [320, 568], [844, 390]]) {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: width <= 1000, reducedMotion: 'reduce' });
      try {
        const page = await context.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
        page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
        await page.goto(`${baseURL}/#play`); await page.locator('#adventure[data-view="title"]').waitFor(); const original = await saves(page);
        await page.locator('#title-journal').click();
        assert.equal(await page.locator('.journal-stat').count(), 4); assert.equal(await page.locator('[data-journal-invite]').count(), 3);
        for (const tab of ['overview', 'story', 'guild', 'expeditions']) {
          await page.locator(`#journal-tab-${tab}`).click(); assert.equal(await page.locator('.journal-panel:visible').count(), 1);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
          await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
          const back = await page.locator('#journal-back').boundingBox(); assert.ok(back.y >= 0 && back.y + back.height <= height, `${width}/${height}: journal navigation stays reachable`);
        }
        assert.equal(await page.locator('.journal-chapter-card').count(), 8); assert.equal(await page.locator('.journal-specialist').count(), 3);
        assert.equal(await page.locator('.journal-badge').count(), 12); assert.equal(await page.locator('.journal-badge[data-earned="true"]').count(), 0);
        assert.doesNotMatch((await page.locator('#front-journal').textContent()), /[✓○✦]/);
        await page.locator('#journal-tab-expeditions').focus(); await page.keyboard.press('Home');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'journal-tab-overview');
        await page.keyboard.press('ArrowRight'); assert.equal(await page.locator('#journal-story').isVisible(), true);
        await page.locator('[data-journal-chapter="6"]').click();
        assert.equal(await page.locator('#atlas-coast').isVisible(), true); assert.equal(await page.locator('#game-layout').isVisible(), false);
        await page.locator('#library-guide').click(); await page.locator('#guide-next').click(); await page.locator('#guide-next').click(); await page.locator('#guide-choose').click();
        assert.equal(await page.locator('#front-modes').isVisible(), true); await page.locator('#front-back').click();
        await page.locator('#title-journal').click(); await page.locator('#journal-tab-guild').click(); await page.locator('[data-journal-kit="mistweaver"]').click();
        assert.equal(await page.locator('#guild-kit').inputValue(), 'mistweaver'); assert.equal(await page.locator('#game-layout').isVisible(), false);
        await page.locator('#library-journal').click(); await page.locator('[data-journal-invite="daily"]').click();
        assert.equal(await page.locator('#expedition-mode').inputValue(), 'daily'); assert.equal(await page.locator('#expedition-seed').getAttribute('readonly'), '');
        await page.locator('#library-options').click(); await page.locator('#settings-close').click();
        await page.waitForFunction(() => document.activeElement.id === 'library-options');
        await page.locator('#library-title').focus(); await page.keyboard.press('Escape');
        assert.equal(await page.locator('#front-home').isVisible(), true); assert.deepEqual(await saves(page), original);
        await enterFirstTrail(page); await page.locator('#adventure-canvas').focus(); await page.keyboard.press('ArrowUp');
        const position = await page.locator('#adventure-canvas').getAttribute('aria-label');
        await page.locator('#game-shell-options').click(); await page.keyboard.press('r'); await page.keyboard.press('ArrowUp'); await page.locator('#settings-close').click();
        await page.waitForFunction(() => document.activeElement.id === 'game-shell-options');
        await page.locator('#game-home').click(); await page.locator('#title-journal').click(); await page.keyboard.press('r'); await page.keyboard.press('ArrowUp');
        assert.equal(await page.locator('#game-turns').textContent(), '1'); await page.keyboard.press('Escape'); await page.locator('#title-continue').click();
        assert.equal(await page.locator('#adventure-canvas').getAttribute('aria-label'), position);
        await clickControl(page, '#game-guide-menu'); await page.locator('#guide-next').click(); await page.locator('#guide-next').click(); await page.locator('#guide-choose').click();
        assert.equal(await page.locator('#front-modes').isVisible(), true); await page.locator('#front-back').click(); await page.locator('#title-continue').click();
        await page.locator('#adventure-canvas').focus(); await page.keyboard.press('p'); await page.locator('#game-result-menu').click(); await page.locator('#title-continue').click();
        assert.equal(await page.locator('#game-turns').textContent(), '1'); assert.equal(await page.locator('#game-overlay').isVisible(), false);
        assert.equal(await page.locator('.game-main').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(25, 54, 48)');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width); assert.deepEqual(errors, []);
        results.push({ width, height, checks: 'All journal tabs and keyboard navigation; sticky main menu; chapter/specialist/daily previews; no save writes while browsing; guide/options focus; exact run preservation through menus and pause.' });
      } finally { await context.close(); }
    }
    const intro = JSON.parse(await readFile(new URL('../tests/fixtures/adventure-routes.json', import.meta.url), 'utf8'))['trail-1'];
    const guild = JSON.parse(await readFile(new URL('../tests/fixtures/guild-routes.json', import.meta.url), 'utf8')).find(f => f.id === 'guild-1' && f.kit === 'echoist' && f.difficulty === 'trail');
    const journey = JSON.parse(await readFile(new URL('../tests/fixtures/expedition-routes.json', import.meta.url), 'utf8')).find(f => f.id === 'long-voyage');
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      try {
        const page = await context.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message)); await page.goto(`${baseURL}/#play`); await enterFirstTrail(page);
        await page.locator('#adventure-canvas').focus(); for (const action of intro) await page.keyboard.press(keys[action]);
        assert.equal(await page.locator('#adventure').getAttribute('data-status'), 'won'); await page.locator('#game-result-menu').click(); await page.locator('#title-journal').click();
        assert.equal(await page.locator('.journal-stat strong').first().textContent(), '1 / 24');
        await page.locator('#journal-tab-story').click(); assert.match(await page.locator('[data-journal-chapter="0"]').textContent(), /Trail 3\/9/);
        await page.locator('#journal-tab-overview').click(); await page.locator('[data-journal-invite="guild"]').click();
        await startGuild(page, guild); await playGuild(page, guild.actions); await assertGuildWin(page, guild);
        await page.locator('#game-home').click(); await page.locator('#title-journal').click(); assert.equal(await page.locator('.journal-stat strong').nth(2).textContent(), '3 / 144');
        await page.locator('#journal-tab-expeditions').click(); await page.locator('#journal-new-expedition').click();
        await page.locator('#expedition-seed').fill(journey.config.seed); await page.locator('#expedition-length').selectOption(String(journey.config.length));
        await page.locator('#expedition-start').click(); await playGuild(page, journey.legs[0].actions);
        assert.equal(await page.locator('#adventure').getAttribute('data-status'), 'won'); await page.locator('#game-primary').click();
        assert.equal(await page.locator('#camp-dialog').isVisible(), true);
        assert.equal(await page.locator('#camp-dialog').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(25, 54, 48)');
        const camp = await page.evaluate(() => {
          const dialog = document.querySelector('#camp-dialog'), choices = dialog.querySelector('.camp-choices').getBoundingClientRect(), actions = dialog.querySelector('.dialog-actions').getBoundingClientRect();
          return { choicesBottom: choices.bottom, actionsTop: actions.top, actionsBottom: actions.bottom, clipped: dialog.scrollHeight > dialog.clientHeight + 1 };
        });
        assert.ok(camp.choicesBottom <= camp.actionsTop && camp.actionsBottom <= 900); assert.equal(camp.clipped, false);
        if (screenshots) await page.screenshot({ path: `.playwright-mcp/complete-camp-${width}.png` });
        await page.locator('#camp-cancel').click(); await page.locator('#game-home').click(); await page.locator('#title-journal').click();
        await page.locator('#journal-tab-expeditions').click(); assert.ok(await page.locator('.journal-badge[data-earned="true"]').count() > 0);
        assert.match(await page.locator('#journal-expedition-totals').textContent(), /1 trail explored/);
        if (screenshots) await page.screenshot({ path: `.playwright-mcp/complete-earned-${width}.png`, fullPage: true });
        const before = await saves(page); await page.locator('#journal-back').click(); await page.locator('#title-journal').click(); assert.deepEqual(await saves(page), before);
        await page.reload(); await page.locator('#adventure[data-view="title"]').waitFor(); await page.locator('#title-journal').click();
        assert.equal(await page.locator('.journal-stat strong').first().textContent(), '1 / 24'); assert.equal(await page.locator('.journal-stat strong').nth(2).textContent(), '3 / 144');
        assert.deepEqual(await saves(page), before); assert.deepEqual(errors, []);
        results.push({ width, checks: 'Real story win, complete Guild dispatch, and completed expedition leg update the journal; camp theme, badge credit, reload and read-only browsing preserve all saves.' });
      } finally { await context.close(); }
    }
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    try {
      await context.addInitScript(() => { Storage.prototype.getItem = function() { throw Error('blocked'); }; Storage.prototype.setItem = function() { throw Error('quota'); }; });
      const page = await context.newPage(); await page.goto(`${baseURL}/#play`); await enterFirstTrail(page); await page.locator('#adventure-canvas').focus();
      for (const action of intro) await page.keyboard.press(keys[action]);
      await page.locator('#game-home').click(); await page.locator('#title-journal').click();
      assert.equal(await page.locator('.journal-stat strong').first().textContent(), '1 / 24'); assert.match(await page.locator('#journal-save-note').textContent(), /saving is unavailable/);
      results.push({ failure: 'storage', checks: 'A real win remains visible in the session journal with a truthful warning when browser storage is blocked.' });
    } finally { await context.close(); }
    return { browser: browser.version(), results };
  } finally { await browser.close(); }
}
