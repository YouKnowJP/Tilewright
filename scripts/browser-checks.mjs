import { checkSettings } from './settings-browser-checks.mjs';
import { checkSaveProfiles } from './save-profiles-browser-checks.mjs';
import { chooseOption, editorButton, closeEditorPanels, revealEditorControl } from './ui-driver.mjs';
import assert from 'node:assert/strict';
import { checkAdventures } from './adventure-browser-checks.mjs';
import { checkContracts } from './contract-browser-checks.mjs';
import { checkExpeditions } from './expedition-browser-checks.mjs';
import { checkSluices } from './sluice-browser-checks.mjs';
import { checkAtlas } from './atlas-browser-checks.mjs';
import { checkPlayLayout } from './layout-browser-checks.mjs';
import { checkHorizon } from './horizon-browser-checks.mjs';
import { checkGuild } from './guild-browser-checks.mjs';
import { checkFrontMenu } from './front-browser-checks.mjs';
import { checkInterface } from './interface-browser-checks.mjs';
import { checkControls } from './controls-browser-checks.mjs';
import { checkTrailhouse } from './trailhouse-browser-checks.mjs';
import { checkStorybooks } from './storybook-browser-checks.mjs';
import { checkSaveData } from './save-data-browser-checks.mjs';
import { checkDropdowns } from './dropdown-browser-checks.mjs';
import { checkCheckpoints } from './checkpoint-browser-checks.mjs';
import { checkMastery } from './mastery-browser-checks.mjs';
import { checkPuzzleLab } from './lab-browser-checks.mjs';
import { checkTraining } from './training-browser-checks.mjs';
import { checkCreators } from './creator-browser-checks.mjs';
import { checkWorkshop } from './workshop-browser-checks.mjs';
import { checkJournal } from './journal-browser-checks.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'http://127.0.0.1:4174';

async function metrics(page) {
  return page.evaluate(() => {
    const viewport = document.querySelector('#viewport'), canvas = document.querySelector('#map');
    const view = viewport.getBoundingClientRect(), map = canvas.getBoundingClientRect();
    return {
      pageWidth: document.documentElement.scrollWidth, width: innerWidth,
      pageHeight: document.documentElement.scrollHeight, pageY: scrollY,
      view: { left: view.left, top: view.top, right: view.left + viewport.clientWidth,
        bottom: view.top + viewport.clientHeight, height: view.height },
      map: { left: map.left, top: map.top, right: map.right, bottom: map.bottom, width: map.width, height: map.height },
      scrollLeft: viewport.scrollLeft, scrollTop: viewport.scrollTop,
      scrollWidth: viewport.scrollWidth, scrollHeight: viewport.scrollHeight,
      clientWidth: viewport.clientWidth, clientHeight: viewport.clientHeight,
    };
  });
}

function assertFits(state) {
  assert.equal(state.pageWidth, state.width, 'The document must not scroll sideways.');
  assert.ok(state.map.left >= state.view.left && state.map.right <= state.view.right + 1, 'Fit must show both horizontal map edges.');
  assert.ok(state.map.top >= state.view.top && state.map.bottom <= state.view.bottom + 1, 'Fit must show both vertical map edges.');
  assert.ok(state.scrollWidth <= state.clientWidth + 1 && state.scrollHeight <= state.clientHeight + 1, 'Fit must not require map scrolling.');
}

async function clickCell(page, x, y) {
  await closeEditorPanels(page);
  await page.locator('#viewport').scrollIntoViewIfNeeded();
  const { map, view } = await metrics(page);
  const point = { x: map.left + (x + .5) * map.width / 28, y: map.top + (y + .5) * map.height / 20 };
  assert.ok(point.x > view.left && point.x < view.right && point.y > view.top && point.y < view.bottom, 'Target cell must actually be visible.');
  const pageY = await page.evaluate(() => scrollY);
  await page.mouse.click(point.x, point.y);
  assert.equal(await page.evaluate(() => scrollY), pageY, 'Focusing the map must not jump the page.');
}

export async function checkBrowser(browserType, { baseURL = BASE, channel = 'chrome' } = {}) {
  const browser = await browserType.launch({ headless: true, channel });
  const results = [];
  try {
    for (const width of [320, 390, 768, 1024, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, acceptDownloads: true });
      let step = 'loading';
      try {
        const page = await context.newPage(), errors = [], failedAssets = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', response => { if (response.status() >= 400) failedAssets.push(response.url()); });
        await page.goto(`${baseURL}/#mapmaker`);
        await page.waitForFunction(() => document.querySelector('#loading-note').hidden);
        step = 'initial fit';
        assertFits(await metrics(page));
        assert.equal(await page.locator('[data-tool] svg').count(), 6, 'Every tool must have a rendered SVG icon.');
        const initial = await metrics(page);
        for (const zoom of ['0.25', '0.5', '0.75', '1', '1.25', '1.5', '2']) {
          step = `zoom ${zoom}`;
          await chooseOption(page,'#zoom',zoom);
          const state = await metrics(page);
          assert.ok(Math.abs(state.map.width - 672 * Number(zoom)) < 1, `Correct canvas width at ${zoom}.`);
          assert.ok(Math.abs(state.view.height - initial.view.height) < 1, 'Zoom must not grow the viewport.');
          assert.ok(Math.abs(state.pageHeight - initial.pageHeight) < 2, 'Zoom must not grow the page.');
          assert.equal(state.pageWidth, width);
        }
        await page.locator('#viewport').evaluate(element => element.scrollTo(element.scrollWidth, element.scrollHeight));
        step = 'far-corner painting';
        let state = await metrics(page);
        assert.ok(state.map.right <= state.view.right && state.map.bottom <= state.view.bottom, 'Scrollbars must reach the far map edges.');
        await editorButton(page, { name: 'Stone tile', exact: true });
        await clickCell(page, 27, 19);
        const saved = () => page.evaluate(() => localStorage.getItem('tilewright.document.v1'));
        assert.equal(JSON.parse(await saved()).layers[0].tiles[559], 6, 'A scrolled and zoomed click must paint the correct cell.');

        await editorButton(page, { name: 'Pan map (H)', exact: true });
        step = 'panning';
        await page.locator('#viewport').evaluate(element => element.scrollTo(0, 0));
        await page.locator('#viewport').scrollIntoViewIfNeeded();
        const beforePan = await saved(), view = (await metrics(page)).view;
        await page.mouse.move(view.left + 160, view.top + 130);
        await page.mouse.down(); await page.mouse.move(view.left + 80, view.top + 70, { steps: 5 }); await page.mouse.up();
        state = await metrics(page);
        assert.ok(state.scrollLeft >= 75 && state.scrollTop >= 55, 'Pan must scroll in both directions.');
        assert.equal(await saved(), beforePan, 'Panning must never edit the document.');

        await chooseOption(page,'#zoom','fit'); assertFits(await metrics(page));
        step = 'page wheel scrolling';
        await page.evaluate(() => {
          const top = document.querySelector('#viewport').getBoundingClientRect().top + scrollY;
          const maximum = document.documentElement.scrollHeight - innerHeight;
          scrollTo(0, Math.min(top - 100, Math.max(0, maximum - 120)));
        });
        state = await metrics(page);
        await page.mouse.move(state.view.left + 100, state.view.top + 100);
        await page.mouse.wheel(0, 120);
        if(state.pageHeight>900+2){await page.waitForFunction(previous => scrollY > previous, state.pageY, { timeout: 3000 });assert.ok((await metrics(page)).pageY > state.pageY, 'Wheel scrolling over a fitted map must reach any remaining page content.');}else assert.equal((await metrics(page)).pageY,0,'A fitted creator workspace may fit entirely on screen.');

        await page.setViewportSize({ width: width === 390 ? 1024 : 390, height: 900 });
        step = 'resize fit';
        await page.waitForFunction(() => {
          const map = document.querySelector('#map').getBoundingClientRect(), view = document.querySelector('#viewport').getBoundingClientRect();
          return map.left >= view.left && map.right <= view.right && map.top >= view.top && map.bottom <= view.bottom;
        });
        assertFits(await metrics(page));
        assert.deepEqual(errors, [], 'No runtime errors during resize or scrolling.');
        assert.deepEqual(failedAssets, [], 'Every editor asset must load successfully.');
        results.push({ width, checks: 'fit, all zoom levels, bounded scrolling, far-corner painting, pan, page wheel, resize, icons, asset loading' });
      } catch (error) { throw new Error(`${width}px, ${step}: ${error.message}`, { cause: error }); }
      finally { await context.close(); }
    }

    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      let step = 'layer settings';
      try {
        const page = await context.newPage(), errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`${baseURL}/#mapmaker`);
        await page.waitForFunction(() => document.querySelector('#loading-note').hidden);
        const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('tilewright.document.v1')));
        await editorButton(page, { name: 'Select Details layer', exact: true });
        await page.locator('.layer-controls summary').click();
        const initialViewHeight = (await metrics(page)).view.height;
        await revealEditorControl(page,page.locator('#layer-name'));await page.locator('#layer-name').fill('Canopy'); await page.locator('#layer-name').press('Enter');
        assert.equal((await saved()).layers[1].name, 'Canopy', 'Layer name must persist.');
        await editorButton(page, { name: 'Duplicate selected layer', exact: true });
        let map = await saved();
        const copyId = map.layers[2].id;
        assert.equal(map.layers[2].name, 'Canopy copy');
        assert.deepEqual(map.layers[2].tiles, map.layers[1].tiles);
        assert.equal(await page.locator('#raise-layer').isDisabled(), true, 'The front layer cannot move further forward.');
        await editorButton(page, { name: 'Move selected layer backward', exact: true });
        assert.equal((await saved()).layers[1].id, copyId);
        await editorButton(page, { name: 'Move selected layer forward', exact: true });
        assert.equal((await saved()).layers[2].id, copyId);
        const beforeDelete = await saved();
        page.once('dialog', dialog => dialog.dismiss());
        await editorButton(page, { name: 'Delete selected layer', exact: true });
        assert.deepEqual(await saved(), beforeDelete, 'Canceling deletion must retain the layer.');
        page.once('dialog', dialog => dialog.accept());
        await editorButton(page, { name: 'Delete selected layer', exact: true });
        assert.equal((await saved()).layers.length, 2);
        await editorButton(page, { name: 'Undo', exact: true });
        assert.deepEqual(await saved(), beforeDelete, 'Undo must restore layer content and order.');
        await editorButton(page, { name: 'Redo', exact: true });
        assert.equal((await saved()).layers.length, 2);

        step = 'layer limits';
        while ((await saved()).layers.length < 6) await editorButton(page, { name: 'Duplicate selected layer', exact: true });
        assert.equal(await page.locator('#duplicate-layer').isDisabled(), true);
        assert.equal(await page.locator('#add-layer').isDisabled(), true);
        assert.ok(Math.abs((await metrics(page)).view.height - initialViewHeight) < 1, 'Layer settings must not stretch the canvas.');
        while ((await saved()).layers.length > 1) {
          page.once('dialog', dialog => dialog.accept());
          await editorButton(page, { name: 'Delete selected layer', exact: true });
        }
        assert.equal(await page.locator('#delete-layer').isDisabled(), true, 'The final layer cannot be deleted.');
        page.once('dialog', dialog => dialog.accept());
        await editorButton(page, { name: /Open the sample map/ });
        const original = await saved();

        step = 'resize preview and cancel';
        const setResize = async () => {
          await page.locator('#resize-width').fill('30'); await page.locator('#resize-height').fill('22');
          await chooseOption(page,'#resize-anchor','center'); await chooseOption(page,'#resize-fill','4');
        };
        await editorButton(page, { name: 'Resize map…', exact: true }); await setResize();
        assert.equal(await page.locator('#resize-preview').getAttribute('width'), '720');
        assert.match(await page.locator('#resize-summary').textContent(), /100 new cells/);
        await editorButton(page, { name: 'Cancel', exact: true });
        assert.deepEqual(await saved(), original, 'Preview and cancel must not edit the map.');

        step = 'anchored growth and history';
        await editorButton(page, { name: 'Resize map…', exact: true }); await setResize();
        await editorButton(page, { name: 'Resize map', exact: true });
        map = await saved(); assert.equal(map.width, 30); assert.equal(map.height, 22);
        for (let i = 0; i < map.layers.length; i++) {
          assert.equal(map.layers[i].tiles[31], original.layers[i].tiles[0], 'Center growth must offset existing tiles.');
          assert.equal(map.layers[i].tiles[0], i === 0 ? 4 : 0, 'Fill must apply only to new back-layer cells.');
        }
        assertFits(await metrics(page));
        await editorButton(page, { name: 'Undo', exact: true }); assert.deepEqual(await saved(), original);
        await editorButton(page, { name: 'Redo', exact: true }); assert.deepEqual(await saved(), map);

        step = 'crop preview and restore';
        await editorButton(page, { name: 'Resize map…', exact: true });
        await page.locator('#resize-width').fill('8'); await page.locator('#resize-height').fill('6');
        await chooseOption(page,'#resize-anchor','bottom-right');
        assert.match(await page.locator('#resize-summary').textContent(), /occupied cells will be cropped/);
        assert.equal(await page.locator('#resize-preview').getAttribute('width'), '192');
        await editorButton(page, { name: 'Resize map', exact: true });
        assert.equal((await saved()).width, 8); assertFits(await metrics(page));
        await editorButton(page, { name: 'Undo', exact: true }); assert.deepEqual(await saved(), map);

        step = 'invalid resize';
        await editorButton(page, { name: 'Resize map…', exact: true });
        await page.locator('#resize-width').fill('65');
        assert.equal(await page.locator('#apply-resize').isDisabled(), true);
        assert.equal(await page.locator('#resize-error').isVisible(), true);
        await editorButton(page, { name: 'Cancel', exact: true }); assert.deepEqual(await saved(), map);
        assert.equal((await metrics(page)).pageWidth, width);
        assert.deepEqual(errors, [], 'Structural editing must not cause runtime errors.');
        results.push({ width, checks: 'layer rename/duplicate/order/delete, limits, cancel/undo/redo, resize preview, anchors, fill, crop, validation, stable layout' });
      } catch (error) { throw new Error(`${width}px, ${step}: ${error.message}`, { cause: error }); }
      finally { await context.close(); }
    }

    const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, acceptDownloads: true });
    try {
      const page = await touchContext.newPage();
      await page.goto(`${baseURL}/#mapmaker`);
      await page.waitForFunction(() => document.querySelector('#loading-note').hidden);
      await chooseOption(page,'#zoom','2');
      await editorButton(page, { name: 'Pan map (H)', exact: true });
      await page.locator('#viewport').evaluate(element => element.scrollTo(0, 0));
      await page.locator('#viewport').scrollIntoViewIfNeeded();
      const view = (await metrics(page)).view, input = await touchContext.newCDPSession(page);
      await input.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: view.left + 180, y: view.top + 140 }] });
      for (let step = 1; step <= 5; step++) {
        await input.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: view.left + 180 - step * 16, y: view.top + 140 - step * 14 }] });
      }
      await input.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      let state = await metrics(page);
      assert.ok(state.scrollLeft >= 75 && state.scrollTop >= 65, 'A real touch drag must pan both axes.');
      assert.equal(await page.evaluate(() => localStorage.getItem('tilewright.document.v1')), null, 'Touch panning must not create an edit.');
      await input.detach();

      await editorButton(page, { name: 'Brush (B)', exact: true });
      await editorButton(page, { name: 'Stone tile', exact: true });
      await page.locator('#viewport').evaluate(element => element.scrollTo(0, 0));
      await clickCell(page, 0, 0);
      const beforeArrows = await page.evaluate(() => localStorage.getItem('tilewright.document.v1'));
      for (let x = 0; x < 27; x++) await page.keyboard.press('ArrowRight');
      for (let y = 0; y < 19; y++) await page.keyboard.press('ArrowDown');
      state = await metrics(page);
      assert.ok(state.map.right <= state.view.right && state.map.bottom <= state.view.bottom, 'Keyboard navigation must reveal the last cell.');
      assert.equal(await page.evaluate(() => localStorage.getItem('tilewright.document.v1')), beforeArrows, 'Cursor navigation must not paint.');
      await page.keyboard.press('Space');
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('tilewright.document.v1')).layers[0].tiles[559]), 6);

      const [download] = await Promise.all([page.waitForEvent('download'), editorButton(page, { name: /Export PNG/ })]);
      const chunks = [];
      for await (const chunk of await download.createReadStream()) chunks.push(chunk);
      const png = Buffer.concat(chunks);
      assert.ok(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'PNG must be a valid image.');
      assert.equal(png.readUInt32BE(16), 672); assert.equal(png.readUInt32BE(20), 480);
      results.push({ checks: 'Touch panning, keyboard cursor visibility, no accidental edits, full-size PNG at 200% zoom.' });

      for (const size of [64, 1]) {
        await editorButton(page, { name: '+ New map', exact: true });
        await page.locator('#new-width').fill(String(size)); await page.locator('#new-height').fill(String(size));
        page.once('dialog', dialog => dialog.accept());
        await editorButton(page, { name: 'Create map', exact: true });
        assertFits(await metrics(page));
        if (size === 1) assert.equal((await metrics(page)).map.width, 24, 'Tiny maps must retain their natural pixel size.');
      }
      results.push({ checks: 'Largest and smallest maps load fitted and fully visible.' });
    } finally { await touchContext.close(); }

    const failureContext = await browser.newContext();
    try {
      const page = await failureContext.newPage();
      await page.route('**/src/app.mjs', route => route.abort());
      await page.goto(`${baseURL}/#mapmaker`);
      await page.getByText('The game could not load.', { exact: true }).waitFor();
      assert.match(await page.locator('#status').textContent(), /startup failed/);
      results.push({ checks: 'Failed module loading shows a useful error instead of an empty canvas.' });
    } finally { await failureContext.close(); }
    return { browser: browser.version(), results };
  } finally { await browser.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { chromium } = await import('playwright');
  console.log(JSON.stringify({ settings: await checkSettings(chromium,{channel:'chrome'}), profiles: await checkSaveProfiles(chromium,{channel:'chrome'}), savedData: await checkSaveData(chromium,{channel:'chrome'}), dropdowns: await checkDropdowns(chromium,{channel:'chrome'}), checkpoints: await checkCheckpoints(chromium,{channel:'chrome'}), mastery: await checkMastery(chromium,{channel:'chrome'}), interface: await checkInterface(chromium,{channel:'chrome'}), controls: await checkControls(chromium,{channel:'chrome'}), trailhouse: await checkTrailhouse(chromium), storybooks: await checkStorybooks(chromium), lab: await checkPuzzleLab(chromium), training: await checkTraining(chromium), creators: await checkCreators(chromium), workshop: await checkWorkshop(chromium), front: await checkFrontMenu(chromium), journal: await checkJournal(chromium), layout: await checkPlayLayout(chromium), editor: await checkBrowser(chromium), adventures: await checkAdventures(chromium), contracts: await checkContracts(chromium), expeditions: await checkExpeditions(chromium), sluices: await checkSluices(chromium), atlas: await checkAtlas(chromium), guild: await checkGuild(chromium), horizon: await checkHorizon(chromium) }, null, 2));
}
