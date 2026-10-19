import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function checkPlayLayout(browserType, { baseURL = 'http://127.0.0.1:4174', channel = 'chrome', screenshots = false } = {}) {
  const browser = await browserType.launch({ headless: true, channel }), results = [];
  try {
    for (const [width, height] of [[320, 740], [390, 844], [768, 900], [1024, 768], [1440, 900], [320, 568], [844, 390]]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', hasTouch: width < 1001 });
      try {
        const page = await context.newPage(), errors = []; page.on('pageerror', error => errors.push(error.message));
        await page.goto(`${baseURL}/#play`); await page.locator('#adventure[data-status="playing"]').waitFor();
        const bounds = await page.evaluate(() => {
          const rect = id => document.querySelector(id).getBoundingClientRect().toJSON();
          return { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
            canvas: rect('#adventure-canvas'), viewport: rect('#game-viewport'), controls: rect('.game-controls'), board: rect('.game-main') };
        });
        assert.equal(bounds.width, width); assert.equal(await page.locator('#adventure-library').isVisible(), false);
        if (height >= 740) {
          assert.equal(bounds.height, height, 'Normal gameplay should fit the viewport without document scrolling.');
          assert.ok(bounds.controls.bottom <= height && bounds.board.bottom <= height);
        } else assert.ok(bounds.height <= 704, 'Short phones and landscape keep one bounded document scroll.');
        assert.ok(bounds.canvas.width > 0 && bounds.canvas.height > 0);
        assert.ok(bounds.canvas.left >= bounds.viewport.left && bounds.canvas.right <= bounds.viewport.right);
        assert.ok(bounds.canvas.top >= bounds.viewport.top && bounds.canvas.bottom <= bounds.viewport.bottom);
        // Opening menus and reading must never spend a turn.
        await page.locator('#game-menu summary').click(); await page.keyboard.press('ArrowUp'); await page.keyboard.press('Escape');
        assert.equal(await page.locator('#game-menu').getAttribute('open'), null);
        assert.equal(await page.locator('#game-turns').textContent(), '0');
        if (width <= 1000) await page.locator('#game-notes-button').click();
        await page.locator('#notes-tab-map').click();
        assert.equal(await page.locator('#game-minimap').isVisible(), true);
        assert.equal(await page.locator('.notes-panel:visible').count(), 1);
        await page.keyboard.press('ArrowRight'); assert.equal(await page.locator('#notes-tab-journal').getAttribute('aria-selected'), 'true');
        await page.keyboard.press('End'); assert.equal(await page.locator('#notes-tab-help').getAttribute('aria-selected'), 'true');
        await page.keyboard.press('Home'); assert.equal(await page.locator('#notes-tab-quest').getAttribute('aria-selected'), 'true');
        if (width <= 1000) {
          await page.keyboard.press('ArrowUp'); await page.keyboard.press('b');
          assert.equal(await page.locator('#game-turns').textContent(), '0');
          await page.keyboard.press('Escape'); assert.equal(await page.locator('#game-notes-dialog').isVisible(), false);
          assert.equal(await page.evaluate(() => document.activeElement.id), 'game-notes-button');
        }
        await page.locator('#game-choose').click();
        assert.equal(await page.locator('#game-layout').isVisible(), false);
        assert.equal(await page.locator('.atlas-chapter:visible').count(), 1);
        const chapterCount = await page.locator('.atlas-nav button').count();
        for (let chapter = 0; chapter < chapterCount; chapter++) {
          await page.locator('.atlas-nav button').nth(chapter).click();
          assert.equal(await page.locator('.atlas-chapter:visible').count(), 1);
          assert.equal(await page.locator('.trail-card:visible').count(), 3);
          assert.equal(await page.locator('.atlas-nav [aria-pressed="true"]').count(), 1);
        }
        await page.keyboard.press('ArrowUp'); await page.keyboard.press('r'); await page.keyboard.press('b');
        assert.equal(await page.locator('#game-turns').textContent(), '0');
        await page.locator('#library-resume').click();
        await page.locator('#adventure-canvas').focus(); await page.keyboard.press('ArrowRight');
        assert.equal(await page.locator('#game-turns').textContent(), '1');
        await page.locator('#game-menu summary').click();
        await page.locator('#game-pause')[width <= 1000 ? 'tap' : 'click']();
        assert.equal(await page.locator('#game-pause').getAttribute('aria-pressed'), 'true', 'Menu actions must activate before the menu closes.');
        await page.locator('#adventure-canvas').focus(); await page.keyboard.press('ArrowUp');
        assert.equal(await page.locator('#game-turns').textContent(), '1', 'Pause must suppress keyboard turns.');
        await page.locator('#game-primary').click();
        await page.locator('#game-menu summary').click();
        await page.locator('#game-restart')[width <= 1000 ? 'tap' : 'click']();
        assert.equal(await page.locator('#game-turns').textContent(), '0', 'Restart must reset the current run.');
        await page.locator('#game-menu summary').click(); await page.locator('#game-restart').focus(); await page.keyboard.press('Tab');
        assert.equal(await page.locator('#game-menu').getAttribute('open'), null, 'Tabbing past the menu must dismiss it.');
        // Crossing the responsive boundary moves the same notes, preserving selection.
        if (width === 390) {
          await page.locator('#game-notes-button').click(); await page.locator('#notes-tab-map').click();
          await page.setViewportSize({ width: 1440, height: 900 });
          await page.waitForFunction(() => document.querySelector('#game-aside').parentElement.id === 'game-layout');
          assert.equal(await page.locator('#game-notes-dialog').isVisible(), false);
          assert.equal(await page.locator('#game-minimap').isVisible(), true);
          await page.setViewportSize({ width, height });
          await page.waitForFunction(() => document.querySelector('#game-aside').parentElement.id === 'game-notes-dialog');
          await page.locator('#game-notes-button').click(); assert.equal(await page.locator('#game-minimap').isVisible(), true);
          await page.locator('#game-notes-close').click();
        }
        if (screenshots && [390,1440].includes(width)) await page.screenshot({ path: `.playwright-mcp/focused-play-${width}.png` });
        assert.deepEqual(errors, []); results.push({ width, height, checks: 'Fitted board, visible controls, bounded short-screen scroll, chapter selection, tab keyboard/focus, safe menus/library, responsive notes relocation.' });
      } finally { await context.close(); }
    }
    return { browser: browser.version(), results };
  } finally { await browser.close(); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { chromium } = await import('playwright'); console.log(JSON.stringify(await checkPlayLayout(chromium), null, 2));
}
