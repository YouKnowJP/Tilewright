import assert from 'node:assert/strict';
import { chooseOption, clickControl } from './ui-driver.mjs';

export async function checkFrontMenu(browserType, { baseURL = 'http://127.0.0.1:4174', channel = 'chrome', screenshots = false } = {}) {
  const browser = await browserType.launch({ headless: true, channel }), results = [];
  try {
    for (const [width, height] of [[320, 740], [390, 844], [768, 900], [1024, 768], [1440, 900], [320, 568], [844, 390]]) {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: width <= 1000 });
      try {
        const page = await context.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
        page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
        await page.goto(`${baseURL}/#play`); await page.locator('#adventure[data-view="title"]').waitFor();
        assert.equal(await page.locator('#game-layout').isVisible(), false); assert.equal(await page.locator('#title-continue').isVisible(), false);
        const saves = () => page.evaluate(() => ['tilewright.document.v1', 'tilewright.adventures.v1', 'tilewright.expedition.v1', 'tilewright.tactics.v1'].map(key => localStorage.getItem(key)));
        const original = await saves();
        await page.keyboard.press('ArrowUp'); await page.keyboard.press('r'); await page.keyboard.press('b');
        assert.equal(await page.locator('#adventure').getAttribute('data-status'), 'idle'); assert.deepEqual(await saves(), original);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
        if (screenshots && [390, 1440].includes(width)) await page.screenshot({ path: `.playwright-mcp/title-${width}.png`, fullPage: true });
        await page.locator('#title-guide').click();
        for (let i = 0; i < 3; i++) {
          assert.equal(await page.locator('.guide-page:visible').count(), 1); assert.equal(await page.locator('#guide-page-count').textContent(), `${i + 1} / 3`);
          if (i < 2) await page.locator('#guide-next').click();
        }
        await page.locator('#guide-back').click(); assert.equal(await page.locator('#guide-page-count').textContent(), '2 / 3');
        await page.keyboard.press('Escape'); assert.equal(await page.evaluate(() => document.activeElement.id), 'title-guide');
        await page.locator('#title-settings').click();
        assert.equal(await page.locator('[data-sound="off"]').getAttribute('aria-pressed'), 'true');
        await page.locator('[data-motion="reduced"]').click(); await page.locator('[data-text-size="large"]').click();
        await page.locator('#settings-volume').focus(); await page.keyboard.press('Home');
        for (let i = 0; i < 7; i++) await page.keyboard.press('ArrowRight');
        assert.equal(await page.locator('#settings-volume-value').textContent(), '35%');
        await page.keyboard.press('Escape'); assert.deepEqual(await saves(), original);
        await page.reload(); await page.locator('#adventure[data-view="title"]').waitFor();
        await page.locator('#title-settings').click();
        assert.equal(await page.locator('[data-motion="reduced"]').getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('[data-text-size="large"]').getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('#settings-volume').inputValue(), '35');
        assert.equal(await page.locator('[data-sound="off"]').getAttribute('aria-pressed'), 'true');
        await page.locator('#settings-close').click();
        await page.locator('#title-play').click(); assert.equal(await page.locator('[data-front-mode]').count(), 4);
        assert.equal(await page.locator('#game-layout').isVisible(), false); assert.equal(await page.locator('#adventure').getAttribute('data-status'), 'idle');
        if (screenshots && width === 1440) await page.screenshot({ path: '.playwright-mcp/title-modes.png', fullPage: true });
        for (const mode of ['guild', 'expeditions', 'story']) {
          await page.locator(`#front-${mode}`).click();
          assert.equal(await page.locator('#adventure-library').isVisible(), true); assert.equal(await page.locator('#library-resume').isVisible(), false);
          assert.equal(await page.locator('#game-layout').isVisible(), false); assert.deepEqual(await saves(), original);
          await page.locator('#library-title').click(); await page.locator('#title-play').click();
        }
        await page.locator('#front-story').click(); await page.locator('[data-stage="trail-1"]').click();
        assert.equal(await page.locator('#adventure').getAttribute('data-view'), 'play');
        assert.equal(await page.locator('#game-turns').textContent(), '0');
        assert.equal(await page.locator('#game-status-text').evaluate(el => getComputedStyle(el).fontSize), '18px');
        await page.locator('#adventure-canvas').focus(); await page.keyboard.press('ArrowUp');
        const position = await page.locator('#adventure-canvas').getAttribute('aria-label'), memory = await page.evaluate(() => localStorage.getItem('tilewright.tactics.v1'));
        await clickControl(page, '#game-settings-button'); await page.keyboard.press('r'); await page.keyboard.press('ArrowUp');
        assert.equal(await page.locator('#game-turns').textContent(), '1'); await page.locator('#settings-close').click();
        await page.waitForFunction(() => document.activeElement.tagName === 'SUMMARY');
        assert.equal(await page.evaluate(() => document.activeElement.tagName), 'SUMMARY');
        await clickControl(page, '#game-title-menu'); await page.keyboard.press('r'); await page.keyboard.press('ArrowDown');
        assert.equal(await page.locator('#game-turns').textContent(), '1');
        assert.equal(await page.locator('#title-continue').isVisible(), true);
        await page.locator('#title-continue').click();
        assert.equal(await page.locator('#adventure-canvas').getAttribute('aria-label'), position);
        assert.equal(await page.evaluate(() => localStorage.getItem('tilewright.tactics.v1')), memory);
        await clickControl(page, '#game-title-menu'); await page.locator('#title-mapmaker').click();
        assert.equal(await page.locator('#editor').isVisible(), true); await page.locator('#mode-play').click();
        assert.equal(await page.locator('#game-title-screen').isVisible(), true); assert.equal(await page.locator('#game-layout').isVisible(), false);
        await page.locator('#title-continue').click(); assert.equal(await page.locator('#game-turns').textContent(), '1');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width); assert.deepEqual(errors, []);
        results.push({ width, height, checks: 'No automatic run; four mode previews; three guide pages; options persist without autoplay; large/reduced settings; menu input isolation; exact continue and mapmaker return.' });
      } finally { await context.close(); }
    }
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      try {
        const page = await context.newPage(); await page.goto(`${baseURL}/#play`); await page.locator('#adventure[data-view="title"]').waitFor();
        const original = await page.evaluate(() => localStorage.getItem('tilewright.document.v1'));
        await page.locator('#title-play').click(); await page.locator('#front-custom').click();
        assert.equal(await page.locator('#adventure').getAttribute('data-view'), 'play');
        assert.equal(await page.locator('#game-title').textContent(), 'Willowbend');
        assert.match(await page.locator('#game-subtitle').textContent(), /your map/);
        assert.equal(await page.locator('#game-turns').textContent(), '0');
        assert.equal(await page.evaluate(() => localStorage.getItem('tilewright.document.v1')), original);
        await clickControl(page, '#game-title-menu'); await page.locator('#title-mapmaker').click();
        await page.locator('#new-map').click(); await page.locator('#new-width').fill('1'); await page.locator('#new-height').fill('1');
        page.once('dialog', dialog => dialog.accept());
        await page.locator('#new-form button[type="submit"]').click(); await page.locator('#mode-play').click();
        await page.locator('#title-play').click(); await page.locator('#front-custom').click();
        assert.equal(await page.locator('#game-title-screen').isVisible(), true);
        assert.equal(await page.locator('#game-layout').isVisible(), false);
        assert.equal(await page.locator('#front-mode-notice').isVisible(), true);
        assert.match(await page.locator('#front-mode-notice').textContent(), /connected|walkable/i);
        await page.locator('#front-mapmaker').click(); assert.equal(await page.locator('#editor').isVisible(), true);
        results.push({ width, checks: 'Explore current map explicitly starts the custom world without changing its document; invalid tiny maps stay in the chooser with useful guidance and an editor exit.' });
      } finally { await context.close(); }
    }
    const recovery = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    try {
      const page = await recovery.newPage(); await page.goto(`${baseURL}/#play`); await page.locator('#adventure[data-view="title"]').waitFor();
      await page.locator('#title-play').click(); await page.locator('#front-expeditions').click();
      await chooseOption(page,'#expedition-mode','contract'); await page.locator('#expedition-seed').fill('menu-lantern');
      await page.locator('#expedition-start').click(); await page.locator('#adventure-canvas').focus(); await page.keyboard.press('Space');
      const before = await page.locator('#adventure-canvas').getAttribute('aria-label');
      assert.equal(await page.locator('#game-turns').textContent(), '1');
      await page.reload(); await page.locator('#adventure[data-view="title"]').waitFor();
      assert.equal(await page.locator('#title-continue').isVisible(), true); assert.equal(await page.locator('#title-expedition').isVisible(), false);
      assert.equal(await page.locator('#game-layout').isVisible(), false);
      await page.locator('#title-continue').click(); await page.locator('#adventure[data-view="play"]').waitFor();
      assert.equal(await page.locator('#game-turns').textContent(), '1'); assert.equal(await page.locator('#adventure-canvas').getAttribute('aria-label'), before);
      await clickControl(page, '#game-title-menu'); await page.locator('#title-settings').click(); await page.locator('[data-sound="on"]').click();
      await page.waitForFunction(() => document.querySelector('[data-sound="on"]').getAttribute('aria-pressed') === 'true');
      await page.locator('[data-sound="off"]').click(); await page.waitForFunction(()=>document.querySelector('[data-sound="off"]').getAttribute('aria-pressed')==='true');
      results.push({ checks: 'A real expedition remains on the title after reload and resumes at its saved turn/position; sound enables only by explicit input and can be switched off.' });
    } finally { await recovery.close(); }
    for (const failure of ['storage', 'audio']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      try {
        await context.addInitScript(failure => {
          if (failure === 'audio') { window.AudioContext = undefined; window.webkitAudioContext = undefined; }
          else { Storage.prototype.getItem = function() { throw Error('blocked'); }; Storage.prototype.setItem = function() { throw Error('quota'); }; }
        }, failure);
        const page = await context.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
        await page.goto(`${baseURL}/#play`); await page.locator('#adventure[data-view="title"]').waitFor(); await page.locator('#title-settings').click();
        if (failure === 'audio') { await page.locator('[data-sound="on"]').click(); assert.match(await page.locator('#settings-audio-note').textContent(), /could not start/); }
        else { await page.locator('[data-text-size="large"]').click(); assert.match(await page.locator('#settings-save-note').textContent(), /Saving is unavailable/); }
        await page.locator('#settings-close').click(); await page.locator('#title-play').click(); await page.locator('#front-story').click(); await page.locator('[data-stage="trail-1"]').click();
        await page.locator('#adventure-canvas').focus(); await page.keyboard.press('ArrowUp'); assert.equal(await page.locator('#game-turns').textContent(), '1');
        assert.deepEqual(errors, []); results.push({ failure, checks: 'Title, options, mode choice and gameplay remain usable with a truthful failure message.' });
      } finally { await context.close(); }
    }
    const delayed=await browser.newContext({viewport:{width:390,height:844}});delayed.setDefaultTimeout(20000);
    let release;
    try{
      const page=await delayed.newPage(),gate=new Promise(resolve=>release=resolve);await page.route('**/src/app.mjs',async route=>{await gate;await route.continue();});await page.goto(`${baseURL}/#play`,{waitUntil:'commit'});
      await page.locator('#startup-retry').waitFor({state:'visible',timeout:20000});assert.match(await page.locator('#startup-status').textContent(),/still loading/);assert.equal(await page.evaluate(()=>localStorage.getItem('tilewright.adventures.v1')),null);
      release();await page.locator('#loading-note[hidden]').waitFor({state:'attached'});assert.equal(await page.locator('#startup-status').isVisible(),false);await page.locator('#title-play').click();await page.locator('#front-story').click();await page.locator('[data-stage="trail-1"]').click();await page.locator('#adventure-canvas').focus();await page.keyboard.press('ArrowUp');assert.equal(await page.locator('#game-turns').textContent(),'1');
      results.push({checks:'A stalled module offers safe Retry after 15 seconds; a late successful load clears the notice and actual gameplay works without erasing saves.'});
    }finally{release?.();await delayed.close();}
    return { browser: browser.version(), results };
  } finally { await browser.close(); }
}
